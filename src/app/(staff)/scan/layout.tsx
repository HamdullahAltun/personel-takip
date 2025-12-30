import { Metadata } from "next";

export const metadata: Metadata = {
    title: "QR Okut",
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
