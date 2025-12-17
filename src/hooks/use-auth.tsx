'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signOut, User, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/firebase/client';
import type { UserProfile } from '@/lib/data';

type UserWithRole = UserProfile & { uid: string };

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect now only handles session restoration from sessionStorage
    setLoading(true);
    const userId = sessionStorage.getItem('userId');
    if (userId) {
      const userDocRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUser({ ...docSnap.data() as UserProfile, uid: docSnap.id });
        } else {
          sessionStorage.removeItem('userId');
          setUser(null);
        }
        setLoading(false);
      }, () => {
        sessionStorage.removeItem('userId');
        setUser(null);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, pass: string) => {
    setLoading(true);
    // Try to find user by username first
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', identifier));
    const querySnapshot = await getDocs(q);

    let userDoc;
    if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
    } else {
        // If not found by username, try by email for backward compatibility
        const emailQuery = query(usersRef, where('email', '==', identifier));
        const emailQuerySnapshot = await getDocs(emailQuery);
        if (!emailQuerySnapshot.empty) {
            userDoc = emailQuerySnapshot.docs[0];
        }
    }

    if (!userDoc) {
        setLoading(false);
        throw new Error('No user found with that username.');
    }

    const userData = userDoc.data() as UserProfile;
    const passwordToTry = userData.password || 'password';

    if (pass === passwordToTry) {
        const loggedInUser: UserWithRole = { ...userData, uid: userDoc.id };
        sessionStorage.setItem('userId', userDoc.id);
        setUser(loggedInUser);
        setLoading(false);
    } else {
        setLoading(false);
        throw new Error('Invalid credentials.');
    }
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem('userId');
    setUser(null);
    // Also sign out from Firebase if there was any session, just in case.
    await signOut(auth);
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
