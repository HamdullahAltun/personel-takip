import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines if using env var
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

export const messaging = admin.messaging();

export async function sendPushNotification(token: string, title: string, body: string) {
    try {
        if (!token) return;
        await messaging.send({
            token,
            notification: {
                title,
                body,
            },
            webpush: {
                fcmOptions: {
                    link: '/'
                }
            }
        });
        console.log('Notification sent successfully');
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
