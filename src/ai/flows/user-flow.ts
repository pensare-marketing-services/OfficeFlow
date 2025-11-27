'use server';
/**
 * @fileoverview This flow handles user creation securely on the backend.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { CreateUserInputSchema, type CreateUserInput } from './user-flow-schema';

// Helper to initialize Firebase Admin SDK safely.
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return { auth: admin.auth(), firestore: admin.firestore() };
}

export async function createUser(input: CreateUserInput): Promise<void> {
  await createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: z.void(),
  },
  async (data) => {
    const { auth, firestore } = initializeFirebaseAdmin();

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
);
