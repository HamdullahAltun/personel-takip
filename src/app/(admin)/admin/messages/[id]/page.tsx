import AdminMessageClient from "./client";

export default async function AdminMessageDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <AdminMessageClient id={id} />;
}
