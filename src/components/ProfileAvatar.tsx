"use client";

import { useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { updateProfilePicture } from "@/app/actions/employee";

export default function ProfileAvatar({ currentImage, userName }: { currentImage: string | null, userName: string }) {
    const [image, setImage] = useState<string | null>(currentImage);
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Dosya 2MB'dan küçük olmalı");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setImage(base64);
            setLoading(true);

            // Upload immediately
            const formData = new FormData();
            formData.append("profilePicture", base64);
            await updateProfilePicture(formData);
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="relative group w-24 h-24 mx-auto md:w-20 md:h-20 md:mx-0">
            <div className="w-full h-full rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {image ? (
                    <img src={image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-3xl font-bold text-slate-400">
                        {userName.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>

            <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-indigo-700 transition active:scale-95">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
            </label>
        </div>
    );
}
