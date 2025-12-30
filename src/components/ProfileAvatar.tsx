"use client";

import { useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { updateProfilePicture } from "@/app/actions/employee";

export default function ProfileAvatar({ currentImage, userName }: { currentImage: string | null, userName: string }) {
    const [image, setImage] = useState<string | null>(currentImage);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset error
        setError(null);

        // Validate File Type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError("Sadece JPG, PNG veya WEBP formatında resimler yüklenebilir.");
            return;
        }

        // Validate File Size (Max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            setError("Dosya boyutu 2MB'dan büyük olamaz. Lütfen daha küçük bir resim seçin.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setImage(base64);
            setLoading(true);

            try {
                // Upload immediately
                const formData = new FormData();
                formData.append("profilePicture", base64);
                const res = await updateProfilePicture(formData);

                if (res.error) {
                    setError("Resim yüklenirken bir hata oluştu.");
                    // Revert image if failed
                    setImage(currentImage);
                }
            } catch (err) {
                setError("Bağlantı hatası.");
                setImage(currentImage);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative group w-24 h-24 mx-auto md:w-20 md:h-20 md:mx-0">
                <div className={`w-full h-full rounded-full bg-slate-100 border-4 shadow-lg overflow-hidden flex items-center justify-center ${error ? 'border-red-400' : 'border-white'}`}>
                    {image ? (
                        <img src={image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-slate-400">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                <label className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer shadow-md transition active:scale-95 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </label>
            </div>

            {error ? (
                <p className="text-[10px] text-red-500 font-bold text-center mt-2 max-w-[150px] leading-tight animate-in slide-in-from-top-1">
                    {error}
                </p>
            ) : (
                <p className="text-[10px] text-slate-400 text-center mt-2 w-full leading-tight">
                    Max 2MB<br />JPG/PNG
                </p>
            )}
        </div>
    );
}
