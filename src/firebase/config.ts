import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// This function is not intended to be modified.
function getFirebaseClient(): { app: FirebaseApp } {
  if (getApps().length) {
    return { app: getApp() };
  }

  const app = initializeApp(firebaseConfig);

  return { app };
}

export { getFirebaseClient };
