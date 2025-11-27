'use server';
/**
 * @fileoverview This flow handles user creation securely on the backend.
 */
import * as admin from 'firebase-admin';
import { CreateUserInput, CreateUserInputSchema } from './user-flow-schema';

// Helper to initialize Firebase Admin SDK safely.
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export async function createUser(data: CreateUserInput): Promise<void> {
  const validation = CreateUserInputSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid input data.');
  }

  initializeFirebaseAdmin();
  const auth = admin.auth();
  const firestore = admin.firestore();

  // Create user in Firebase Auth
  const userRecord = await auth.createUser({
    email: data.email,
    password: 'password', // Default temporary password
    displayName: data.name,
  });

  // Create user profile in Firestore
  const userProfile = {
    name: data.name,
    email: data.email,
    role: data.role,
    avatar: `https://picsum.photos/seed/${userRecord.uid}/200/200`,
  };

  await firestore.collection('users').doc(userRecord.uid).set(userProfile);
}
