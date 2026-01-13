import { prisma } from "@/lib/prisma";
import * as admin from "firebase-admin";
import { createFirebaseAdminApp } from "./firebase-admin";
import { logInfo, logError } from "./log-utils";

// Ensure App is initialized
createFirebaseAdminApp();

export async function createNotification(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
    // 1. Save to Database
    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
        }
    });

    // 2. Try to send Push Notification
    await sendPushNotification(userId, title, message);

    return notification;
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
    // 1. Get User's FCM Token
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true }
    });

    if (!user || !user.fcmToken) {
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
    } catch (error: unknown) {
        const firebaseError = error as { code?: string };
        logError(`FCM Send Error for user ${userId}`, error);

        // Handle invalid token errors
        if (firebaseError.code === 'messaging/registration-token-not-registered' ||
            firebaseError.code === 'messaging/invalid-argument') {
            logInfo(`Removing invalid FCM token for user ${userId}`);
            await prisma.user.update({
                where: { id: userId },
                data: { fcmToken: null }
            }).catch(e => logError("Failed to remove invalid token", e));
        }
    }
}

export async function sendBroadcastNotification(title: string, body: string) {
    // 1. Save to DB for everyone? (Too many rows?) 
    // Usually for broadcast we just send push, or we could have a global broadcast table.
    // For now, let's keep it push only or handle it specifically.
    const users = await prisma.user.findMany({
        where: { role: 'STAFF' },
        select: { id: true, fcmToken: true }
    });

    for (const u of users) {
        // Create DB entry
        await prisma.notification.create({
            data: {
                userId: u.id,
                title,
                message: body,
                type: 'INFO'
            }
        }).catch(e => logError("Broadcast DB Notification Error", e));

        // Send Push
        if (u.fcmToken) {
            await sendPushNotification(u.id, title, body).catch(e => logError("Broadcast Push Notification Error", e));
        }
    }
}
