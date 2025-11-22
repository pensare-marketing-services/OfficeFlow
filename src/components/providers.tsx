'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/use-auth';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
