'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { users } from '@/lib/data';
import type { UserProfile } from '@/lib/data';

interface AuthContextType {
  user: (UserProfile & { uid: string }) | null;
  login: (name: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if a user is saved in session storage
    const savedUser = sessionStorage.getItem('officeflow-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);
  
  const login = useCallback(async (name: string): Promise<boolean> => {
    setLoading(true);
    const foundUser = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (foundUser) {
      const userToSave = { ...foundUser, uid: foundUser.id };
      setUser(userToSave);
      sessionStorage.setItem('officeflow-user', JSON.stringify(userToSave));
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('officeflow-user');
    router.push('/login');
  }, [router]);

  const value = { user, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
