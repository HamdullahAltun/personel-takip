import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Personel Yönetimi',
    default: 'Personel Yönetim Sistemi',
  },
  description: 'Personel Takip ve Yönetim Sistemi',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Personel Takip',
  },
};

export const viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import PushNotificationListener from "@/components/PushNotificationListener";
import AppUrlListener from "@/components/AppUrlListener";
import MobilePolish from "@/components/MobilePolish";
import OfflineIndicator from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import SocketInitializer from "@/components/SocketInitializer";
import VoiceAssistant from "@/components/VoiceAssistant";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <PushNotificationListener />
          <AppUrlListener />
          <MobilePolish />
          <SocketInitializer>
            <OfflineIndicator />
            <InstallPrompt />
            <Toaster position="top-right" richColors />
            {children}
            <VoiceAssistant />
          </SocketInitializer>
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
