"use client";

import { useEffect, useRef } from "react";

export function VoiceVisualizer({ isListening }: { isListening: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isListening || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let phase = 0;

        const draw = () => {
            if (!ctx || !canvas) return;
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();

            for (let x = 0; x < width; x++) {
                const y = centerY + Math.sin(x * 0.1 + phase) * (Math.sin(x * 0.05 + phase * 0.5) * 10);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.stroke();
            phase += 0.2;
            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationId);
    }, [isListening]);

    if (!isListening) return null;

    return (
        <canvas
            ref={canvasRef}
            width={60}
            height={40}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />
    );
}
