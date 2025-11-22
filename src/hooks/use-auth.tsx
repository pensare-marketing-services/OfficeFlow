'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, Auth, signOut } from 'firebase/auth';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/data';

interface AuthContextType {
  user: (UserProfile & { uid: string }) | null;
  loading: boolean;
  auth: Auth | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  auth: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const { auth, firestore } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false); 
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Keep loading until we have the firestore doc
        setLoading(true); 
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          setUser({ ...userData, uid: firebaseUser.uid });
        } else {
          console.error("User data not found in Firestore for UID:", firebaseUser.uid);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      // Only set loading to false after all auth and firestore checks are done
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, router]);

  const value = { user, loading, auth };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
