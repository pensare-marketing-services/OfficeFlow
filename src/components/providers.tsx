'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { TaskProvider } from '@/hooks/use-tasks';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TaskProvider>
        {children}
      </TaskProvider>
    </AuthProvider>
  );
}
