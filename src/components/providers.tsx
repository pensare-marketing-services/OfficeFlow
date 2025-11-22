'use client';

import type { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

const { firebaseApp, firestore, auth } = initializeFirebase();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
      <FirebaseErrorListener />
    </FirebaseClientProvider>
  );
}
