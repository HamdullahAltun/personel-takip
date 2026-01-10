"use client";

import { useState, useEffect } from "react";
import { Sun, Calendar, Cloud, CloudRain, Snowflake } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

function WeatherWidget() {
    const [temp, setTemp] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Istanbul coordinates: 41.0082, 28.9784
        fetch("https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=temperature_2m,weather_code")
            .then(res => res.json())
            .then(data => {
                if (data.current) {
                    setTemp(Math.round(data.current.temperature_2m));
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-xs text-indigo-200 mt-1 font-medium">Yükleniyor...</p>;

    return (
        <p className="text-xs text-indigo-200 mt-1 font-medium flex items-center justify-end gap-1">
            <span>İstanbul</span>
            <span className="font-bold">{temp !== null ? `${temp}°` : ""}</span>
        </p>
    );
}

export default function WelcomeHeader({ userName }: { userName: string }) {
    const [time, setTime] = useState(new Date());
    const hour = time.getHours();
    const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "Tünaydın" : "İyi Akşamlar";

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative overflow-hidden rounded-3xl bg-indigo-600 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-1">
                        <Calendar className="h-4 w-4" />
                        {format(time, "d MMMM yyyy, EEEE", { locale: tr })}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">
                        {greeting}, {userName.split(' ')[0]}
                    </h1>
                    <p className="text-indigo-100 mt-2 text-sm md:text-base opacity-90">
                        Bugün harika işler başaracağına inanıyoruz!
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 min-w-[140px]">
                    <div className="text-right flex-1">
                        <p className="text-2xl font-bold tabular-nums tracking-wider leading-none">
                            {format(time, "HH:mm")}
                        </p>
                        <WeatherWidget />
                    </div>
                    <div className="h-10 w-10 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full shadow-lg flex items-center justify-center">
                        <Sun className="h-6 w-6 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
}
