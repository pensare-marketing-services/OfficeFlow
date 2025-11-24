'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, User, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase/client';
import type { UserProfile } from '@/lib/data';

type UserWithId = UserProfile & { uid: string };

interface AuthContextType {
  user: UserWithId | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithId | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle the rest
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // User is signed in, now get their profile.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userProfile = docSnap.data() as UserProfile;
                setUser({
                    ...userProfile,
                    uid: firebaseUser.uid,
                });
            } else {
                // This case can happen if the user record is deleted from firestore but not auth
                setUser(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });

        return () => unsubProfile();

      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
