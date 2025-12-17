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

  const login = useCallback(async (identifier: string, pass: string) => {
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
      throw new Error('No user found with that username or email.');
    }

    const userData = userDoc.data() as UserProfile;

    // For new users with custom password OR old users with default password
    const passwordToTry = userData.password || 'password';

    if (pass !== passwordToTry) {
       // If custom password check fails, try Firebase auth for users who might have changed it
       try {
         await signInWithEmailAndPassword(auth, userData.email, pass);
         // If this succeeds, onAuthStateChanged will handle setting the user.
         return;
       } catch (e) {
         throw new Error('Invalid credentials.');
       }
    }
    
    // For users matching custom password or default password, sign them in with Firebase
    // This will keep them authenticated with Firebase services
    await signInWithEmailAndPassword(auth, userData.email, pass);
    // onAuthStateChanged will handle the rest
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const userProfile = docSnap.data() as UserProfile;
                setUser({
                    ...userProfile,
                    uid: firebaseUser.uid,
                });
                setLoading(false);
            } else {
                // Profile doesn't exist, this might be a first-time login
                // after manual creation in Auth. Let's create a default profile.
                console.log("User profile not found, creating a default one.");
                const newUserProfile: UserProfile = {
                    name: firebaseUser.displayName || firebaseUser.email || 'New User',
                    email: firebaseUser.email!,
                    role: 'employee', // Default role
                };

                try {
                    await setDoc(userDocRef, newUserProfile);
                    // The onSnapshot listener will fire again with the new data,
                    // so we don't need to call setUser here.
                } catch (error) {
                    console.error("Error creating user profile:", error);
                    setUser(null);
                    setLoading(false);
                    signOut(auth);
                }
            }
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
            signOut(auth); // Sign out if we can't read the profile
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
