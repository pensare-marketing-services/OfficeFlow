'use server';
/**
 * @fileoverview This flow handles user creation securely on the backend.
 */
import { CreateUserInput, CreateUserInputSchema } from './user-flow-schema';
import * as admin from 'firebase-admin';

// Helper to initialize Firebase Admin SDK safely.
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // Use application default credentials to connect to Firebase.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export async function createUser(data: CreateUserInput): Promise<{uid: string}> {
  initializeFirebaseAdmin();
  
  const validation = CreateUserInputSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid input data.');
  }

  const firestore = admin.firestore();

  try {
    // For this workaround, we will just create the user in Firestore.
    // We will generate a temporary ID for the document.
    const userRef = firestore.collection('users').doc();
    const userProfile = {
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: `https://picsum.photos/seed/${userRef.id}/200/200`,
    };

    await userRef.set(userProfile);

    // Return the generated UID so the client knows it was successful.
    return { uid: userRef.id };

  } catch (error: any) {
    // Log other unexpected errors
    console.error('Error creating user profile in Firestore:', error);
    throw new Error('An unexpected error occurred during user profile creation.');
  }
}
