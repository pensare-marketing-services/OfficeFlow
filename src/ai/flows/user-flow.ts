'use server';
/**
 * @fileoverview This action handles user creation securely on the backend
 * by calling the Firebase Auth and Firestore REST APIs.
 */
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { CreateUserInput, CreateUserInputSchema } from './user-flow-schema';

async function firebaseFetch(path: string, options: RequestInit) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase Project ID is not configured.');
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
   if (!apiKey) {
    throw new Error('Firebase API Key is not configured.');
  }

  const url = `${path}?key=${apiKey}`;
  const response = await fetch(url, options);
  
  const data = await response.json();

  if (!response.ok) {
    if (data.error && data.error.message) {
      if (data.error.message === 'EMAIL_EXISTS') {
        throw new Error('This email address is already in use by another account.');
      }
      throw new Error(data.error.message);
    }
    throw new Error('An unknown error occurred with Firebase.');
  }
  return data;
}


export async function createUser(data: CreateUserInput): Promise<{ uid: string }> {
  const validation = CreateUserInputSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid input data.');
  }

  const { role, username, password, department, nickname } = validation.data;

  // 1. Create user in Firebase Authentication via REST API
  // To keep things simple with custom auth, we will just use a random email
  const randomEmail = `${username}-${Date.now()}@officeflow.app`;
  const authApiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp`;
  
  const authResponse = await firebaseFetch(authApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail,
        password: password,
        returnSecureToken: true,
      }),
    }
  );

  const uid = authResponse.localId;
  if (!uid) {
    throw new Error('Failed to create user in Firebase Authentication.');
  }

  // 2. Create user profile in Firestore via REST API
  const userProfile: any = {
    role: { stringValue: role },
    username: { stringValue: username },
    nickname: { stringValue: nickname },
    password: { stringValue: password },
    email: { stringValue: randomEmail },
  };

  if (department) {
    userProfile.department = { stringValue: department };
  }


  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firestoreApiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  
  await firebaseFetch(firestoreApiUrl, {
      method: 'PATCH', // Using PATCH to create or overwrite
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: userProfile }),
    }
  );

  // Return the new UID so the client knows it was successful.
  return { uid: uid };
}
