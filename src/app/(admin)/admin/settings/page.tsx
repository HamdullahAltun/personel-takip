
"use client";

import { useState, useEffect } from "react";
import { Save, MapPin, Navigation, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Define types for Map Props
interface SettingsMapProps {
    lat: number;
    lng: number;
    radius: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

// Load Map dynamically to avoid SSR issues
const MapComponent = dynamic<SettingsMapProps>(() => import("@/components/admin/SettingsMap"), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-slate-100 rounded-xl flex items-center justify-center animate-pulse">Harita Yükleniyor...</div>
});

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        officeLat: 41.0082,
        officeLng: 28.9784,
        geofenceRadius: 500
    });

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.officeLat) setSettings(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success("Ayarlar başarıyla kaydedildi");
            } else {
                toast.error("Kaydetme başarısız");
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setSettings(prev => ({ ...prev, officeLat: lat, officeLng: lng }));
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Şirket Ayarları</h1>
                <p className="text-slate-500">Konum, vardiya ve genel sistem yapılandırması.</p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-slate-900">Ofis Konumu</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Enlem (Latitude)</label>
                            <input
                                type="number"
                                step="any"
                                value={settings.officeLat}
                                onChange={e => setSettings({ ...settings, officeLat: parseFloat(e.target.value) })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Boylam (Longitude)</label>
                            <input
                                type="number"
                                step="any"
                                value={settings.officeLng}
                                onChange={e => setSettings({ ...settings, officeLng: parseFloat(e.target.value) })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Geofence Yarıçapı (Metre)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="50"
                                    max="5000"
                                    step="50"
                                    value={settings.geofenceRadius}
                                    onChange={e => setSettings({ ...settings, geofenceRadius: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-slate-500 text-sm font-medium">m</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Personelin check-in yapabileceği maksimum mesafe.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                            Ayarları Kaydet
                        </button>
                    </div>
                </div>

                {/* Right Column: Map */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-full min-h-[500px] flex flex-col">
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Navigation className="h-4 w-4 text-indigo-500" />
                                Konum Önizleme
                            </h3>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                                Haritadan konum seçebilirsiniz
                            </span>
                        </div>
                        <div className="flex-1 rounded-xl overflow-hidden border border-slate-100 z-0">
                            <MapComponent
                                lat={settings.officeLat}
                                lng={settings.officeLng}
                                radius={settings.geofenceRadius}
                                onLocationSelect={handleLocationSelect}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
