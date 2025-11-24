'use client';

import { getFirebaseClient } from './config';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const { app } = getFirebaseClient();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
