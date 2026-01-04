"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation } from 'lucide-react';
import useSWR from 'swr';
import 'leaflet/dist/leaflet.css';

// Dynamic import for Leaflet map to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function LiveMap() {
    // Poll every 10 seconds for location updates
    const { data: staff = [], isLoading } = useSWR('/api/admin/staff-locations', fetcher, { refreshInterval: 10000 });
    const [Leaflet, setLeaflet] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const L = await import('leaflet');
            // Fix default icon issue in Leaflet with Next.js
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: '/marker-icon-2x.png',
                iconUrl: '/marker-icon.png',
                shadowUrl: '/marker-shadow.png',
            });
            setLeaflet(L);
        })();
    }, []);

    const activeStaff = staff.filter((s: any) => s.lastLat && s.lastLng);

    if (!Leaflet) return <div className="h-96 flex items-center justify-center bg-slate-50 rounded-xl">Harita Yükleniyor...</div>;

    return (
        <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-0">
            <MapContainer
                center={[39.9208, 32.8541]} // Turkey Default (Ankara)
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {activeStaff.map((person: any) => (
                    <Marker
                        key={person.id}
                        position={[person.lastLat, person.lastLng]}
                        icon={new Leaflet.Icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })}
                    >
                        <Popup>
                            <div className="p-2 min-w-[150px]">
                                <h3 className="font-bold text-slate-900">{person.name}</h3>
                                <p className="text-xs text-slate-500 mb-2">{person.role}</p>

                                {person.fieldTasks && person.fieldTasks.length > 0 ? (
                                    <div className="bg-indigo-50 p-2 rounded text-xs border border-indigo-100 mb-2">
                                        <span className="font-bold text-indigo-700 block">Aktif Görev:</span>
                                        {person.fieldTasks[0].title}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 italic mb-2">Aktif görev yok</div>
                                )}

                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <ClockIcon className="w-3 h-3" />
                                    {new Date(person.lastLocationUpdate).toLocaleTimeString()}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {activeStaff.length === 0 && !isLoading && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 text-sm max-w-xs z-[1000]">
                    <div className="flex items-center gap-2 text-amber-600 font-bold mb-1">
                        <Navigation className="w-4 h-4" />
                        Aktif Konum Yok
                    </div>
                    <p className="text-slate-500 text-xs">Şu an çevrimiçi veya konumu açık personel bulunmuyor.</p>
                </div>
            )}
        </div>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    )
}
