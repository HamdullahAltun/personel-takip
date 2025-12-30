import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Giriş Yap",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
