"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Image as ImageIcon, Type, X, Send, UploadCloud, Loader2 } from "lucide-react";

interface StoryCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function StoryCreator({ isOpen, onClose, onCreated }: StoryCreatorProps) {
    const [type, setType] = useState<"IMAGE" | "TEXT">("IMAGE");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setImageUrl(data.url);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Resim yüklenirken hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (type === "IMAGE" && !imageUrl) return;
        if (type === "TEXT" && !content) return;

        setLoading(true);
        try {
            const res = await fetch("/api/social/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    content,
                    mediaUrl: imageUrl
                })
            });

            if (res.ok) {
                setContent("");
                setImageUrl("");
                onCreated();
                onClose();
            }
        } catch (error) {
            console.error("Story creation failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-center">Hikaye Ekle</DialogTitle>
                </DialogHeader>

                <div className="flex justify-center gap-4 mb-4">
                    <button
                        onClick={() => setType("IMAGE")}
                        className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all w-24 ${type === "IMAGE" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                    >
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-xs font-bold">Görsel</span>
                    </button>
                    <button
                        onClick={() => setType("TEXT")}
                        className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all w-24 ${type === "TEXT" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                    >
                        <Type className="w-6 h-6" />
                        <span className="text-xs font-bold">Yazı</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {type === "IMAGE" && (
                        <div className="space-y-4">
                            {!imageUrl ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-700 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                                >
                                    {uploading ? (
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                    ) : (
                                        <>
                                            <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                                            <p className="text-sm text-slate-400 font-medium">Resim Seç veya Yükle</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                </div>
                            ) : (
                                <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video bg-black relative group">
                                    <img src={imageUrl} className="w-full h-full object-contain" alt="Preview" />
                                    <button
                                        onClick={() => setImageUrl("")}
                                        className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <input
                                placeholder="Açıklama ekle (Opsiyonel)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder:text-slate-500"
                            />
                        </div>
                    )}

                    {type === "TEXT" && (
                        <div className="relative aspect-[9/16] max-h-[400px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center p-6 text-center">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Ne düşünüyorsun?"
                                className="w-full h-full bg-transparent border-none focus:ring-0 text-white text-xl font-bold text-center placeholder:text-white/50 resize-none"
                                maxLength={200}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (type === "IMAGE" && !imageUrl) || (type === "TEXT" && !content)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? "Paylaşılıyor..." : (
                            <>
                                <Send className="w-4 h-4" />
                                Hikayende Paylaş
                            </>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
