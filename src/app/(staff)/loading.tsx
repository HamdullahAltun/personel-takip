import { Loader2 } from "lucide-react";

export default function StaffLoading() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] w-full">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">Yükleniyor...</p>
        </div>
    );
}
