"use client";
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';

const AppUrlListener = () => {
    const router = useRouter();

    useEffect(() => {
        // Android Back Button Listener
        App.addListener('backButton', ({ canGoBack }) => {
            const path = window.location.pathname;
            const rootPages = ['/dashboard', '/login', '/'];

            if (!rootPages.includes(path)) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });
    }, []);

    useEffect(() => {
        App.addListener('appUrlOpen', (event: { url: string }) => {
            const slug = event.url.split('.ir').pop();
            if (slug) {
                router.push(slug);
            }
        });
    }, [router]);

    return null;
};

export default AppUrlListener;
