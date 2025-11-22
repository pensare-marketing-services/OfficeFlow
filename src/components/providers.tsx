'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseErrorListener } from './FirebaseErrorListener';

const { firebaseApp, firestore, auth } = initializeFirebase();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      <AuthProvider>
        {children}
        <FirebaseErrorListener />
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
