import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Görev Panosu",
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
