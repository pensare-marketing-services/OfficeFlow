'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useAuth as useFirebaseAuth } from '../provider';
import { useFirestore } from '../provider';
import { useDoc } from '../firestore/use-doc';
import { useMemoFirebase } from '../hooks';
import type { UserProfile } from '@/lib/data';

interface UserState {
  auth: FirebaseUser;
  data: UserProfile | null;
}

export function useUser() {
  const { auth } = useFirebaseAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.auth.email) return null;
    return doc(firestore, 'users', user.auth.email);
  }, [firestore, user?.auth.email]);

  const { data: userData, loading: userDocLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUser((prev) => ({ ...prev, auth: firebaseUser } as UserState));
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (userData) {
      setUser((prev) => ({ ...prev, data: userData } as UserState));
    }
  }, [userData]);

  return { user, loading: loading || userDocLoading, error };
}
