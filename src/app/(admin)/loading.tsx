import { Loader2 } from "lucide-react";

export default function AdminLoading() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] lg:h-full w-full">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">Sayfa Yükleniyor...</p>
        </div>
    );
}
