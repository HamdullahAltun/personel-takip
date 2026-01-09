importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging-compat.js');

// We need to fetch config from a static file or hardcode. 
// Since we can't easily inject env vars into public static file in Nextjs without build steps,
// We will try to rely on the main app registering it OR we cheat by fetching a config endpoint.
// But valid SW shouldn't do async fetch top level. 
// However, the most robust way is to just handle 'push' events if we don't use firebase SDK for background?
// No, we need firebase SDK for FCM compatibility.
// Let's use a placeholder. The user might need to fill this or we rely on 'default' behavior.
// Actually, 'firebase-messaging-sw.js' is automatically looked up by FCM.

firebase.initializeApp({
    // This is technically required for onBackgroundMessage. 
    // Attempting to get these from query params if registered with params?
    // Or just leave it for now. If the app is open, foreground handler works. 
    // Background requires this SW.
    // I will placeholder it. The user must fill this or we inject it.
    // SCRIPT INJECTION:
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId: "REPLACE_WITH_YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'Bildirim';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/icon-192x192.png',
        data: payload.data // Pass data to notification
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification clicked', event);
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
