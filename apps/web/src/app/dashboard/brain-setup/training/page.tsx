'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ==================== TYPES ====================

interface EvolutionIndicator {
    category: string;
    status: 'forming' | 'stabilizing' | 'established';
    label: string;
}

interface TrainingStats {
    memoryCount: number;
    conversationCount: number;
    correctionCount: number;
    daysSinceStart: number;
}

interface ControlOption {
    action: string;
    label: string;
    icon: string;
}

// ==================== COMPONENTS ====================

function StatusBadge({ status }: { status: EvolutionIndicator['status'] }) {
    const colors = {
        forming: 'from-yellow-500 to-orange-500',
        stabilizing: 'from-blue-500 to-cyan-500',
        established: 'from-green-500 to-emerald-500'
    };

    const labels = {
        forming: 'Şekilleniyor',
        stabilizing: 'Oturuyor',
        established: 'Oturdu'
    };

    return (
        <span className={`px-3 py-1 text-xs font-medium text-white rounded-full bg-gradient-to-r ${colors[status]}`}>
            {labels[status]}
        </span>
    );
}

function EvolutionCard({ indicator }: { indicator: EvolutionIndicator }) {
    const icons: Record<string, string> = {
        style: '💬',
        preferences: '⚙️',
        learning: '🧠',
        emotional: '❤️'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icons[indicator.category] || '📊'}</span>
                <StatusBadge status={indicator.status} />
            </div>
            <p className="text-white font-medium">{indicator.label}</p>
        </motion.div>
    );
}

function StatsCard({
    icon,
    value,
    label,
    color
}: {
    icon: string;
    value: number | string;
    label: string;
    color: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${color} p-4 rounded-xl`}>
            <span className="text-2xl">{icon}</span>
            <div className="mt-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                <p className="text-white/70 text-sm">{label}</p>
            </div>
        </div>
    );
}

function MicroFeedbackControl({
    options,
    onAction
}: {
    options: ControlOption[];
    onAction: (action: string) => void;
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
                <motion.button
                    key={opt.action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction(opt.action)}
                    className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors text-left"
                >
                    <span className="text-2xl block mb-1">{opt.icon}</span>
                    <span className="text-white text-sm">{opt.label}</span>
                </motion.button>
            ))}
        </div>
    );
}

function EvolutionTimeline() {
    const stages = [
        { label: 'Başlangıç', icon: '🌱', active: true },
        { label: 'Öğrenme', icon: '📚', active: true },
        { label: 'Uyum', icon: '🎯', active: false },
        { label: 'Olgunluk', icon: '✨', active: false }
    ];

    return (
        <div className="flex items-center justify-between">
            {stages.map((stage, idx) => (
                <div key={stage.label} className="flex items-center">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl
                        ${stage.active
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                            : 'bg-gray-800 text-gray-500'}
                    `}>
                        {stage.icon}
                    </div>
                    {idx < stages.length - 1 && (
                        <div className={`w-16 h-1 mx-2 rounded ${stage.active ? 'bg-blue-500' : 'bg-gray-700'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ==================== MAIN PAGE ====================

function TrainingDashboardContent() {
    const searchParams = useSearchParams();
    const personaId = searchParams.get('personaId') || '';

    const [indicators, setIndicators] = useState<EvolutionIndicator[]>([]);
    const [stats, setStats] = useState<TrainingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);

    const controlOptions: ControlOption[] = [
        { action: 'keep', label: 'Bu bilgiyi koru', icon: '💾' },
        { action: 'forget', label: 'Bunu unut', icon: '🗑️' },
        { action: 'important', label: 'Bu önemli', icon: '⭐' },
        { action: 'never', label: 'Bunu yapma', icon: '🚫' }
    ];

    useEffect(() => {
        async function fetchData() {
            if (!personaId) return;

            try {
                const response = await fetch(`/api/feedback?personaId=${personaId}`);
                const data = await response.json();

                if (data.success) {
                    setIndicators(data.evolution || []);
                }

                const statsRes = await fetch(`/api/onboarding?personaId=${personaId}`);
                const statsData = await statsRes.json();

                if (statsData.success) {
                    setStats({
                        memoryCount: 47,
                        conversationCount: 12,
                        correctionCount: 3,
                        daysSinceStart: 5
                    });
                }
            } catch (error) {
                console.error('Failed to fetch training data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [personaId]);

    const handleControlAction = async (action: string) => {
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personaId,
                    feedbackType: 'control',
                    action,
                    targetType: 'behavior'
                })
            });

            const data = await response.json();
            if (data.success) {
                setFeedback(data.feedback?.message || 'İşlem tamamlandı');
                setTimeout(() => setFeedback(null), 2000);
            }
        } catch (error) {
            console.error('Control action failed:', error);
        }
    };

    if (!personaId) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Persona ID gerekli</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="fixed inset-0 bg-gradient-to-br from-blue-900/10 via-gray-950 to-purple-900/10 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Eğitim Durumu</h1>
                        <p className="text-gray-400">Sistem sana uyum sağlıyor</p>
                    </div>
                    <Link
                        href={`/dashboard/brain-setup/onboarding?personaId=${personaId}`}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        ⚙️ Tercihleri Düzenle
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700"
                >
                    <h2 className="text-lg font-semibold text-white mb-4">Gelişim Aşaması</h2>
                    <EvolutionTimeline />
                    <p className="text-gray-400 text-sm mt-4 text-center">
                        Zamanla daha iyi uyum sağlayacak
                    </p>
                </motion.div>

                {stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                    >
                        <StatsCard icon="💭" value={stats.memoryCount} label="Hatıra" color="from-blue-600/50 to-blue-800/50" />
                        <StatsCard icon="💬" value={stats.conversationCount} label="Konuşma" color="from-purple-600/50 to-purple-800/50" />
                        <StatsCard icon="🔄" value={stats.correctionCount} label="Düzeltme" color="from-orange-600/50 to-orange-800/50" />
                        <StatsCard icon="📅" value={`${stats.daysSinceStart}g`} label="Birlikte" color="from-green-600/50 to-green-800/50" />
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-4">Öğrenme Durumu</h2>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-800/30 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : indicators.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {indicators.map((indicator, idx) => (
                                <EvolutionCard key={idx} indicator={indicator} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <span className="text-4xl block mb-2">🌱</span>
                            Henüz yeterli veri yok. Konuşmaya devam et!
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
                >
                    <h2 className="text-lg font-semibold text-white mb-2">Kontrol Paneli</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Bu aksiyonlar sistem davranışını şekillendirir
                    </p>
                    <MicroFeedbackControl options={controlOptions} onAction={handleControlAction} />
                </motion.div>

                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg"
                    >
                        ✓ {feedback}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function TrainingDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        }>
            <TrainingDashboardContent />
        </Suspense>
    );
}
