'use server';
/**
 * @fileoverview This flow handles user creation securely on the backend.
 */
import { CreateUserInput, CreateUserInputSchema } from './user-flow-schema';
import * as admin from 'firebase-admin';

// Helper to initialize Firebase Admin SDK safely.
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
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

  const { name, email, role } = validation.data;
  const auth = admin.auth();
  const firestore = admin.firestore();

  try {
    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      emailVerified: true, // Or false, depending on your flow
      password: 'password', // Default password
      displayName: name,
    });

    // Create user profile in Firestore
    const userProfile = {
      name: name,
      email: email,
      role: role,
      avatar: `https://picsum.photos/seed/${userRecord.uid}/200/200`,
    };

    await firestore.collection('users').doc(userRecord.uid).set(userProfile);

    // Return the new UID so the client knows it was successful.
    return { uid: userRecord.uid };

  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
        throw new Error('This email address is already in use by another account.');
    }
    // Log other unexpected errors
    console.error('Error creating user:', error);
    throw new Error('An unexpected error occurred during user creation.');
  }
}
