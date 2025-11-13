import { useMemo } from 'react';
import type { DependencyList } from 'react';
import {
  Query,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore';

type FirebaseRef = Query | DocumentReference | CollectionReference | null;

export function useMemoFirebase<T extends FirebaseRef>(
  factory: () => T,
  deps: DependencyList | undefined
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
