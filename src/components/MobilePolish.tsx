"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

            // Revalidate data on app resume
            await App.addListener('appStateChange', async (state) => {
                if (state.isActive) {
                    // Trigger a light haptic to indicate app is active
                    try {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        // Force soft refresh of data by toggling a hidden state or just relying on SWR revalidateOnFocus
                        // Next.js router.refresh() will re-run server components and fetchers
                        router.refresh();
                    } catch (e) {
                        // Haptics might fail on web
                    }
                }
            });

            // Set StatusBar color if on mobile
            try {
                const platform = (window as any).Capacitor?.getPlatform();

                await StatusBar.setStyle({
                    style: Style.Light // Dark text for light background
                });

                if (platform === 'android') {
                    await StatusBar.setBackgroundColor({ color: '#ffffff' });
                }

                // On iOS, we want to make sure the app fits the safe area
                // viewport-fit=cover is already set in layout.tsx

                await SplashScreen.hide();
            } catch (e) {
                // Ignore errors (e.g. running on web)
            }
        };

        setupAppListeners();
    }, [router, pathname]);

    return null; // This component renders nothing
}
