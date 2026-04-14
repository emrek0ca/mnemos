'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ==================== TYPES ====================

interface Persona {
    id: string;
    name: string;
    hasCompletedOnboarding: boolean;
    evolutionStatus: 'new' | 'learning' | 'adapting' | 'mature';
}

// ==================== MAIN PAGE ====================

export default function BrainSetupPage() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPersonas() {
            try {
                const response = await fetch('/api/personas');
                const data = await response.json();

                if (data.personas) {
                    setPersonas(data.personas.map((p: { id: string; name: string }) => ({
                        ...p,
                        hasCompletedOnboarding: false,
                        evolutionStatus: 'new'
                    })));

                    if (data.personas.length === 1) {
                        setSelectedPersona(data.personas[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch personas:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPersonas();
    }, []);

    const getEvolutionIcon = (status: Persona['evolutionStatus']) => {
        switch (status) {
            case 'new': return '🌱';
            case 'learning': return '📚';
            case 'adapting': return '🎯';
            case 'mature': return '✨';
        }
    };

    const getEvolutionLabel = (status: Persona['evolutionStatus']) => {
        switch (status) {
            case 'new': return 'Yeni Başlangıç';
            case 'learning': return 'Öğreniyor';
            case 'adapting': return 'Uyum Sağlıyor';
            case 'mature': return 'Olgun';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-white mb-4">
                        🧠 Beyin Kurulumu
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Dijital kişiliğini oluştur ve eğit.
                        Tercihlerine göre sana uyum sağlayacak.
                    </p>
                </motion.div>

                {/* Persona Selection */}
                {personas.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">Persona Seç</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {personas.map(persona => (
                                <button
                                    key={persona.id}
                                    onClick={() => setSelectedPersona(persona.id)}
                                    className={`p-4 rounded-xl border transition-all ${selectedPersona === persona.id
                                        ? 'bg-blue-600/20 border-blue-500'
                                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <span className="text-2xl block mb-2">{getEvolutionIcon(persona.evolutionStatus)}</span>
                                    <span className="text-white font-medium">{persona.name}</span>
                                    <span className="text-gray-500 text-xs block">{getEvolutionLabel(persona.evolutionStatus)}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Action Cards */}
                {(selectedPersona || personas.length === 1) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {/* Onboarding Card */}
                        <Link
                            href={`/dashboard/brain-setup/onboarding?personaId=${selectedPersona || personas[0]?.id}`}
                            className="group"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30 h-full"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <span className="text-5xl">🎯</span>
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                        Başlangıç
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Kişilik Ayarları
                                </h3>
                                <p className="text-gray-400 mb-4">
                                    6 basit soru ile tercihlerini belirle.
                                    Sistem sana göre şekillenecek.
                                </p>
                                <div className="flex items-center text-blue-400 group-hover:text-blue-300">
                                    <span>Başla</span>
                                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </motion.div>
                        </Link>

                        {/* Training Dashboard Card */}
                        <Link
                            href={`/dashboard/brain-setup/training?personaId=${selectedPersona || personas[0]?.id}`}
                            className="group"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 h-full"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <span className="text-5xl">📊</span>
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                        Dashboard
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Eğitim Durumu
                                </h3>
                                <p className="text-gray-400 mb-4">
                                    Sistem nasıl öğreniyor? Evrim durumunu izle,
                                    davranışları yönlendir.
                                </p>
                                <div className="flex items-center text-purple-400 group-hover:text-purple-300">
                                    <span>Görüntüle</span>
                                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </motion.div>
                        </Link>
                    </motion.div>
                )}

                {/* How it works */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-12 text-center"
                >
                    <h2 className="text-lg font-semibold text-white mb-6">Nasıl Çalışır?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
                            <span className="text-3xl block mb-3">1️⃣</span>
                            <h3 className="text-white font-medium mb-2">Tercihlerini Belirle</h3>
                            <p className="text-gray-500 text-sm">
                                Basit sorularla iletişim tarzını belirle
                            </p>
                        </div>
                        <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
                            <span className="text-3xl block mb-3">2️⃣</span>
                            <h3 className="text-white font-medium mb-2">Konuşarak Öğret</h3>
                            <p className="text-gray-500 text-sm">
                                Her konuşma sistem davranışını şekillendirir
                            </p>
                        </div>
                        <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700">
                            <span className="text-3xl block mb-3">3️⃣</span>
                            <h3 className="text-white font-medium mb-2">Evrilmesini İzle</h3>
                            <p className="text-gray-500 text-sm">
                                Zamanla sana daha iyi uyum sağlar
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Academic note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 text-center text-gray-600 text-xs"
                >
                    <p>
                        Sistemde öğrenme, model ağırlıklarının güncellenmesiyle değil; kullanıcıya özgü
                        hafıza, değer ve davranış katmanlarının zaman içinde şekillenmesiyle sağlanmaktadır.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
