"use client";

import { useEffect, useRef } from 'react';

const UPDATE_INTERVAL = 30000; // 30 seconds
const MIN_DISTANCE = 0.0001; // ~11 meters (change needed to trigger update)

export default function LocationTracker() {
    const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!('geolocation' in navigator)) return;

        console.log("Location Tracker initialized");

        const sendUpdate = async (lat: number, lng: number) => {
            // Check if distance changed significantly to save battery/bandwidth
            if (lastPosRef.current) {
                const dLat = Math.abs(lat - lastPosRef.current.lat);
                const dLng = Math.abs(lng - lastPosRef.current.lng);
                if (dLat < MIN_DISTANCE && dLng < MIN_DISTANCE) return;
            }

            try {
                await fetch('/api/staff/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng }),
                });
                lastPosRef.current = { lat, lng };
                console.log("Location updated:", lat, lng);
            } catch (err) {
                console.error("Location update failed:", err);
            }
        };

        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    sendUpdate(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
            );
        }, UPDATE_INTERVAL);

        // Initial update
        navigator.geolocation.getCurrentPosition(
            (pos) => sendUpdate(pos.coords.latitude, pos.coords.longitude),
            () => console.log("Initial location fetch failed"),
            { enableHighAccuracy: true, timeout: 5000 }
        );

        return () => clearInterval(interval);
    }, []);

    return null;
}
