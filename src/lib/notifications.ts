import { prisma } from "@/lib/prisma";
import * as admin from "firebase-admin";
import { createFirebaseAdminApp } from "./firebase-admin";

// Ensure App is initialized
createFirebaseAdminApp();

export async function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
    // 1. Get User's FCM Token
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true }
    });

    if (!user || !user.fcmToken) {
        // console.log(`No FCM token found for user ${userId}`);
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
    const users = await prisma.user.findMany({
        where: { fcmToken: { not: null } },
        select: { id: true }
    });

    for (const u of users) {
        await sendPushNotification(u.id, title, body);
    }
}
