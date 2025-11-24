'use client';

import { AuthProvider } from '@/hooks/use-auth';
import React from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
