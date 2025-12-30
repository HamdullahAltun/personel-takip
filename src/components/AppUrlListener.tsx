"use client";
import { useEffect } from 'react';
import { App } from '@capacitor/app';

const AppUrlListener = () => {
    useEffect(() => {
        // Android Back Button Listener
        App.addListener('backButton', ({ canGoBack }) => {
            // Check if we can go back in browser history
            // We use window.location.pathname to check if we are on root pages
            const path = window.location.pathname;
            const rootPages = ['/dashboard', '/login', '/'];

            if (!rootPages.includes(path)) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });

        // Deep Links (Optional)
        App.addListener('appUrlOpen', (data: any) => {
            // Handle deep links if needed
        });
    }, []);

    return null;
};

export default AppUrlListener;
