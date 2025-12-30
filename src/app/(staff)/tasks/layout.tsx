import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Görevlerim",
};

export default function StaffTasksLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
