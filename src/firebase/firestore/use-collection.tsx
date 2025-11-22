'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  CollectionReference,
  QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(
  query: Query | CollectionReference | null
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    // const unsubscribe = onSnapshot(
    //   query,
    //   (snapshot: QuerySnapshot) => {
    //     const docs = snapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     })) as T[];
    //     setData(docs);
    //     setLoading(false);
    //     setError(null);
    //   },
    //   (err) => {
    //     const permissionError = new FirestorePermissionError({
    //       path: (query as CollectionReference).path,
    //       operation: 'list',
    //     });
    //     errorEmitter.emit('permission-error', permissionError);
    //     setError(permissionError);
    //     setLoading(false);
    //   }
    // );

    // return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
