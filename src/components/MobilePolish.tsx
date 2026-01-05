"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function MobilePolish() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Handle Android Back Button
        const setupAppListeners = async () => {
            await App.addListener('backButton', ({ canGoBack }) => {
                const currentPath = window.location.pathname;

                // Paths where back button should minimize app instead of going back
                const exitPaths = ['/dashboard', '/login', '/admin'];

                if (exitPaths.some(p => currentPath === p || currentPath.endsWith(p))) {
                    App.exitApp();
                } else {
                    // Try to go back in Next.js router
                    router.back();
                }
            });

            // Set StatusBar color if on mobile
            try {
                await StatusBar.setStyle({ style: Style.Light });
                // Note: Overlay not always supported on all Android webviews without extra config, 
                // but we can try to set a color.
                if ((window as any).Capacitor?.getPlatform() === 'android') {
                    await StatusBar.setBackgroundColor({ color: '#ffffff' });
                }
            } catch (e) {
                // Ignore errors (e.g. running on web)
            }
        };

        setupAppListeners();
    }, [router, pathname]);

    return null; // This component renders nothing
}
