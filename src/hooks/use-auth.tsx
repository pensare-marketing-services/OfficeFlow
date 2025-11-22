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

// In a real app, you would fetch the current user from your auth system
const mockUser: AuthContextType['user'] = {
  uid: 'admin-uid',
  name: 'Admin User',
  email: 'admin@officeflow.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjI5MzU5MTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType['user'] | null>(mockUser);
  const [loading, setLoading] = useState(false);
  
  const login = useCallback(async (name: string): Promise<boolean> => {
    // This is a mock login. In a real app, you'd integrate with an auth service.
    console.log(`Logging in as ${name}`);
    const foundUser = mockUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (foundUser) {
      setUser({ ...foundUser, uid: foundUser.id });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    console.log('Logging out');
    setUser(null);
  }, []);

  const value = { user, login, logout, loading, firebaseUser: null };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
