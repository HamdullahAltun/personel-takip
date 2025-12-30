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
};

import PushNotificationListener from "@/components/PushNotificationListener";
import AppUrlListener from "@/components/AppUrlListener";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PushNotificationListener />
        <AppUrlListener />
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
