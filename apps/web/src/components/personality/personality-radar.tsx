'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface RadarDataPoint {
    label: string;
    value: number;
    fullLabel: string;
}

interface PersonalityRadarProps {
    data: RadarDataPoint[];
    size?: number;
    color?: string;
    showLabels?: boolean;
    animated?: boolean;
}

export function PersonalityRadar({
    data,
    size = 280,
    color = '#6366f1',
    showLabels = true,
    animated = true
}: PersonalityRadarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 40;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        const numPoints = data.length;
        const angleStep = (2 * Math.PI) / numPoints;

        // Draw background circles
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Draw axis lines
        ctx.strokeStyle = '#cbd5e1';
        data.forEach((_, index) => {
            const angle = angleStep * index - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius
            );
            ctx.stroke();
        });

        // Draw data polygon
        ctx.beginPath();
        data.forEach((point, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const r = point.value * radius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '10');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke the polygon
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw data points
        data.forEach((point, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const r = point.value * radius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

    }, [data, size, color, centerX, centerY, radius]);

    return (
        <motion.div
            initial={animated ? { opacity: 0, scale: 0.8 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
            style={{ width: size, height: size }}
        >
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="absolute inset-0"
            />
            {showLabels && data.map((point, index) => {
                const numPoints = data.length;
                const angleStep = (2 * Math.PI) / numPoints;
                const angle = angleStep * index - Math.PI / 2;
                const labelRadius = radius + 25;
                const x = centerX + Math.cos(angle) * labelRadius;
                const y = centerY + Math.sin(angle) * labelRadius;

                return (
                    <motion.div
                        key={point.label}
                        initial={animated ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="absolute text-xs font-medium text-slate-600 whitespace-nowrap"
                        style={{
                            left: x,
                            top: y,
                            transform: 'translate(-50%, -50%)'
                        }}
                        title={point.fullLabel}
                    >
                        {point.label}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// Big Five için hazır veri dönüştürücü
export function bigFiveToRadarData(bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
}): RadarDataPoint[] {
    return [
        { label: 'O', value: bigFive.openness, fullLabel: 'Açıklık (Openness)' },
        { label: 'C', value: bigFive.conscientiousness, fullLabel: 'Sorumluluk (Conscientiousness)' },
        { label: 'E', value: bigFive.extraversion, fullLabel: 'Dışadönüklük (Extraversion)' },
        { label: 'A', value: bigFive.agreeableness, fullLabel: 'Uyumluluk (Agreeableness)' },
        { label: 'N', value: bigFive.neuroticism, fullLabel: 'Nevrotiklik (Neuroticism)' },
    ];
}

// Genişletilmiş profil için
export function fullProfileToRadarData(profile: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    decisionSpeed: number;
    abstractThinking: number;
    dominance: number;
}): RadarDataPoint[] {
    return [
        { label: 'Açık', value: profile.openness, fullLabel: 'Deneyime Açıklık' },
        { label: 'Düzen', value: profile.conscientiousness, fullLabel: 'Düzenlilik & Sorumluluk' },
        { label: 'Sosyal', value: profile.extraversion, fullLabel: 'Dışadönüklük' },
        { label: 'Uyum', value: profile.agreeableness, fullLabel: 'Uyumluluk' },
        { label: 'Hassas', value: profile.neuroticism, fullLabel: 'Duygusal Hassasiyet' },
        { label: 'Hızlı', value: profile.decisionSpeed, fullLabel: 'Karar Hızı' },
        { label: 'Soyut', value: profile.abstractThinking, fullLabel: 'Soyut Düşünme' },
        { label: 'Baskın', value: profile.dominance, fullLabel: 'Baskınlık' },
    ];
}
