"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export default function PushNotificationListener() {

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const registerPush = async () => {
            try {
                // Request permission
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    return;
                }

                // Register with FCM
                await PushNotifications.register();

                // Listeners
                PushNotifications.addListener('registration', async (token) => {
                    // Send to backend
                    await fetch('/api/notifications/register', {
                        method: 'POST',
                        body: JSON.stringify({ token: token.value }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Push Reg Error:', error);
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    // Optional: Show toast or local notification if app is open
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    // Navigate to specific page if needed
                    // const data = notification.notification.data;
                    // if (data.url) router.push(data.url);
                });

            } catch (e) {
                console.error('Push Setup Failed:', e);
            }
        };

        registerPush();

        return () => {
            // Cleanup listeners if necessary (Capacitor doesn't strictly require removeAllListeners on unmount usually, but good practice)
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };

    }, []);

    return null; // Invisible component
}
