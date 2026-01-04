"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Users, Navigation, Send, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Dynamic import for Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export default function OperationsPage() {
    const [staffLocations, setStaffLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        // Load Leaflet icon fix on client side
        import("leaflet").then((leaflet) => {
            const DefaultIcon = leaflet.Icon.Default.prototype as any;
            delete DefaultIcon._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });
            setL(leaflet);
        });

        fetchLocations();
        const interval = setInterval(fetchLocations, 30000); // 30s update
        return () => clearInterval(interval);
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/admin/staff-locations');
            if (res.ok) {
                const data = await res.json();
                setStaffLocations(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Operasyon Komuta Merkezi</h1>
                    <p className="text-slate-500">Saha personelinin anlık konumları ve rota takibi</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Canlı İzleme Aktif
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
                {/* Statistics Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Users className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">Aktif Saha Personeli</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">
                            {staffLocations.filter(s => s.lastLat).length}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                        <div className="p-4 border-b bg-slate-50 font-bold text-xs text-slate-500 uppercase flex items-center gap-2">
                            <Navigation className="h-4 w-4" /> Personel Listesi
                        </div>
                        <div className="max-h-[400px] overflow-y-auto divide-y">
                            {staffLocations.map(s => (
                                <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-slate-900">{s.name}</span>
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                            s.lastLat ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {s.lastLat ? 'Online' : 'Konum Yok'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        {s.lastLocationUpdate ? `Son Güncelleme: ${new Date(s.lastLocationUpdate).toLocaleTimeString()}` : 'Veri yok'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map Area */}
                <div className="lg:col-span-3 bg-slate-200 rounded-3xl overflow-hidden shadow-inner relative border border-slate-200 h-full min-h-[500px]">
                    {!L ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : (
                        <MapContainer
                            center={[41.0082, 28.9784]}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {staffLocations.filter(s => s.lastLat).map(s => (
                                <Marker key={s.id} position={[s.lastLat, s.lastLng]}>
                                    <Popup>
                                        <div className="p-1">
                                            <h4 className="font-bold text-slate-900">{s.name}</h4>
                                            <p className="text-xs text-slate-500">{s.role}</p>
                                            <div className="mt-2 pt-2 border-t flex flex-col gap-1">
                                                <span className="text-[10px] text-slate-400 italic">Son Görülme: {new Date(s.lastLocationUpdate).toLocaleTimeString()}</span>
                                                <button className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold mt-1">Görev Ata</button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}

                    {/* Legend / Overlay */}
                    <div className="absolute bottom-6 right-6 z-[400] bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white/20">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                                Personel Konumu
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <div className="w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-sm" />
                                Aktif Görevler
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
