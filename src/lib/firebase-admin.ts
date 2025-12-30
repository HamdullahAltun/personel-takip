import "server-only";
import * as admin from "firebase-admin";

function formatPrivateKey(key: string | undefined) {
    if (!key) return undefined;

    let cleanKey = key;
    // Remove wrapping quotes if present
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
        cleanKey = cleanKey.slice(1, -1);
    }

    // Replace literal '\n' with actual newlines if they exist (handling single-line input)
    cleanKey = cleanKey.replace(/\\n/g, "\n");

    // Robust PEM reconstruction
    try {
        const header = "-----BEGIN PRIVATE KEY-----";
        const footer = "-----END PRIVATE KEY-----";

        if (cleanKey.includes(header) && cleanKey.includes(footer)) {
            // Extract body
            const body = cleanKey
                .replace(header, "")
                .replace(footer, "")
                .replace(/\s/g, ""); // Remove ALL whitespace (spaces, tabs, newlines) from body

            // Reconstruct perfect PEM
            return `${header}\n${body}\n${footer}`;
        }
    } catch (e) {
        // Fallback
    }

    return cleanKey;
}

export function createFirebaseAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
        if (process.env.NODE_ENV === 'production') {
            console.error("FIREBASE CREDENTIALS MISSING IN PRODUCTION");
        }
        return null;
    }

    // Debug Key (Safe log - don't log full key)
    console.log(`[Firebase Admin] Init Project: ${projectId}`);
    console.log(`[Firebase Admin] Key Length: ${privateKey.length}`);
    console.log(`[Firebase Admin] Key Start: ${privateKey.substring(0, 20)}...`);
    console.log(`[Firebase Admin] Key End: ...${privateKey.substring(privateKey.length - 20)}`);

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    } catch (error) {
        console.error("Firebase Admin Init Failed:", error);
        return null;
    }
}

export async function getFirebaseAuth() {
    const app = createFirebaseAdminApp();
    if (!app) {
        // Return a mock or throw? Throwing effectively disables auth routes.
        throw new Error("Firebase Admin not initialized. Check environment variables.");
    }
    return app.auth();
}
