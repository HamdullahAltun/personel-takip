"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
    const [startY, setStartY] = useState(0);
    const [opacity, setOpacity] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const controls = useAnimation();
    const THRESHOLD = 100; // Drag threshold to trigger refresh

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let currentY = 0;
        let pulling = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                setStartY(e.touches[0].clientY);
                pulling = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!pulling) return;

            const y = e.touches[0].clientY;
            const diff = y - startY;

            if (diff > 0 && window.scrollY <= 0) {
                // e.preventDefault(); // Prevent native scroll if desired, but might be aggressive
                currentY = diff * 0.4; // Friction
                controls.set({ y: currentY });
                setOpacity(Math.min(diff / THRESHOLD, 1));
            } else {
                pulling = false;
            }
        };

        const handleTouchEnd = async () => {
            if (!pulling) return;
            pulling = false;

            if (currentY > THRESHOLD * 0.4) {
                setIsRefreshing(true);
                controls.start({ y: 60 }); // Stay visible

                try {
                    await Haptics.impact({ style: ImpactStyle.Medium });
                } catch { }

                // Trigger refresh
                router.refresh();

                // Wait a bit to simulate network or for refresh to complete visually
                setTimeout(() => {
                    setIsRefreshing(false);
                    controls.start({ y: 0 });
                    setOpacity(0);
                }, 1500);

            } else {
                controls.start({ y: 0 });
                setOpacity(0);
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startY, controls, router, startY]);

    return (
        <div ref={containerRef} className="relative">
            <motion.div
                animate={controls}
                className="absolute top-0 left-0 w-full flex justify-center -mt-10 z-10 pointer-events-none"
                style={{ opacity: isRefreshing ? 1 : opacity }}
            >
                <div className="bg-white rounded-full p-2 shadow-md border border-slate-100 flex items-center justify-center">
                    <Loader2 className={`h-5 w-5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
            </motion.div>
            <motion.div animate={controls}>
                {children}
            </motion.div>
        </div>
    );
}
