'use server';
/**
 * @fileoverview This flow handles user creation securely on the backend.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { CreateUserInputSchema, type CreateUserInput } from './user-flow-schema';


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
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
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

    await admin.firestore().collection('users').doc(userRecord.uid).set(userProfile);
  }
);
