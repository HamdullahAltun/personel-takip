import { prisma } from "@/lib/prisma";
import admin from "firebase-admin";

// Initialize Firebase Admin (Singleton)
if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }
    } catch (error) {
        console.error("Firebase Admin Init Error:", error);
    }
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
    // 1. Get User's FCM Token
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true }
    });

    if (!user || !user.fcmToken) {
        console.log(`No FCM token found for user ${userId}`);
        return;
    }

    // 2. Send Notification
    try {
        if (!admin.apps.length) return; // Firebase not configured

        await admin.messaging().send({
            token: user.fcmToken,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "default",
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                    }
                }
            }
        });
        console.log(`Notification sent to ${userId}`);
    } catch (error) {
        console.error("FCM Send Error:", error);
    }
}

export async function sendBroadcastNotification(title: string, body: string) {
    // For simplicity, we loop through users with tokens. 
    // Ideally, subscribe everyone to a 'general' topic.
    const users = await prisma.user.findMany({
        where: { fcmToken: { not: null } },
        select: { id: true }
    });

    for (const u of users) {
        await sendPushNotification(u.id, title, body);
    }
}
