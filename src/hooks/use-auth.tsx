'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { users as mockUsers } from '@/lib/data'; // For email/password mapping


interface AuthContextType {
  user: (UserProfile & { uid: string }) | null;
  login: (name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(firestore, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({ uid: fbUser.uid, ...userDoc.data() } as AuthContextType['user']);
        } else {
          // Handle case where user exists in Auth but not Firestore
           const mockUser = mockUsers.find(u => u.email === fbUser.email);
           if (mockUser) {
              const newUserProfile: UserProfile = {
                name: mockUser.name,
                email: mockUser.email,
                role: mockUser.role,
                avatar: mockUser.avatar
              };
              await setDoc(userDocRef, newUserProfile);
              setUser({ uid: fbUser.uid, ...newUserProfile });
           } else {
             setUser(null);
           }
        }
        router.replace('/dashboard');
      } else {
        setFirebaseUser(null);
        setUser(null);
        router.replace('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, router]);


  const login = useCallback(async (name: string): Promise<boolean> => {
     if (!auth) return false;
    
    // This is a simplified login. We find a user by name in the mock data,
    // get their email, and use a dummy password for the demo.
    // In a real app, you'd have a proper registration flow.
    const mockUser = mockUsers.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (!mockUser || !mockUser.email) {
      return false;
    }
    
    try {
       // Using a fixed password for simplicity, as we don't have one in mock data.
       // The user account must be pre-created in Firebase Auth.
      await signInWithEmailAndPassword(auth, mockUser.email, 'password123');
      return true;
    } catch (error: any) {
      // Handle login errors (e.g., user not found, wrong password)
      console.error("Firebase login failed:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          // In a dev environment, we could auto-create the user here for ease of use.
          console.log("Login failed, user may not exist in Firebase Auth.");
      }
      return false;
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (auth) {
      await signOut(auth);
      // The onAuthStateChanged listener will handle redirecting to /login
    }
  }, [auth]);

  const value = { user, login, logout, loading, firebaseUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
