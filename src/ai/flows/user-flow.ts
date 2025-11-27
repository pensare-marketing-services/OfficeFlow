'use server';
/**
 * @fileoverview This flow handles user creation securely on the backend.
 */
import * as admin from 'firebase-admin';
import { CreateUserInput, CreateUserInputSchema } from './user-flow-schema';

// Helper to initialize Firebase Admin SDK safely.
function initializeFirebaseAdmin() {
  console.log("print");
  if (!admin.apps.length) {
    // Use application default credentials to connect to Firebase.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export async function createUser(data: CreateUserInput): Promise<void> {
  console.log("printf");
  // Initialize first to prevent crashes.
  initializeFirebaseAdmin();
  
  const validation = CreateUserInputSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid input data.');
  }

  const auth = admin.auth();
  const firestore = admin.firestore();

  try {
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
  } catch (error: any) {
    // Re-throw specific errors to be caught by the client
    if (error.code === 'auth/email-already-exists') {
        throw new Error('auth/email-already-exists');
    }
    // Log other unexpected errors
    console.error('Error creating user:', error);
    throw new Error('An unexpected error occurred during user creation.');
  }
}
