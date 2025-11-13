'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';

const { firebaseApp, firestore, auth } = initializeFirebase();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseClientProvider>
  );
}
