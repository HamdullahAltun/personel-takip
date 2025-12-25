import "server-only";
import * as admin from "firebase-admin";

function formatPrivateKey(key: string | undefined) {
    return key?.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
        // During build or if envs are missing, we might want to throw or return null.
        // For build safety, if we are in a static generation phase where these aren't needed, we can skip.
        // But API routes need them.
        if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            // If we are strictly building and don't have secrets, we can't init.
            // Returning null or a mock might be dangerous if used.
            throw new Error("Missing Firebase Admin credentials in .env");
        }

        // Fallback for dev/build without creds (to avoid crash on import)
        console.warn("Firebase Admin credentials missing. Skipping initialization.");
        return null;
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

// Initialize lazily or export safe accessor
// Changing pattern: Export a function to get Auth, not the Auth instance directly object-level.
// This prevents crash on file import.

export async function getFirebaseAuth() {
    const app = createFirebaseAdminApp();
    if (!app) {
        throw new Error("Firebase Admin not initialized. Check environment variables.");
    }
    return app.auth();
}
