
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface SettingsMapProps {
    lat: number;
    lng: number;
    radius: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function SettingsMap({ lat, lng, radius, onLocationSelect }: SettingsMapProps) {
    return (
        <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} />
            <Circle center={[lat, lng]} radius={radius} pathOptions={{ fillColor: 'blue', fillOpacity: 0.1, color: 'blue' }} />
            <LocationMarker onSelect={onLocationSelect} />
        </MapContainer>
    );
}
