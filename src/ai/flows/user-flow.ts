'use server';
/**
 * @fileoverview This flow handles user creation securely on the backend.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import * as admin from 'firebase-admin';

export const CreateUserInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'employee']),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

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
