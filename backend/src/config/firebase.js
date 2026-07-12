import admin from "firebase-admin";

let isInitialized = false;

export function getFirebaseAdmin() {
  if (!isInitialized) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        isInitialized = true;
        console.log("✓ Firebase Admin SDK Initialized (via service account env)");
      } else {
        admin.initializeApp();
        isInitialized = true;
        console.log("✓ Firebase Admin SDK Initialized (default credentials)");
      }
    } catch (error) {
      console.warn("Firebase Admin SDK initialization warning:", error.message);
      // We do not crash the app, but log a warning if environment is not set up yet
    }
  }
  return admin;
}
