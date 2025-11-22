'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile as User } from '@/lib/data';
import { users as mockUsers } from '@/lib/data';

type UserWithId = User & { id: string };

interface AuthContextType {
  user: UserWithId | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithId | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    // Find the user in our mock data
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (foundUser) {
      setUser(foundUser);
      setLoading(false);
      return true;
    }

    setUser(null);
    setLoading(false);
    return false;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setLoading(false);
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
