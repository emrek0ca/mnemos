'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';

interface PersonalitySetupBannerProps {
    personaId: string;
    setupCompleted?: boolean;
}

export function PersonalitySetupBanner({ personaId, setupCompleted }: PersonalitySetupBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    // Eğer setup tamamlandıysa veya dismiss edildiyse gösterme
    if (setupCompleted || dismissed) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
            >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 md:p-5 text-white shadow-lg">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
                        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
                    </div>

                    <div className="relative flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Kişilik Profilin Eksik</h3>
                                <p className="text-sm text-white/80">
                                    Dijital ikizinin sana daha iyi benzesi için kişilik testini tamamla.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={`/dashboard/brain-setup/personality?personaId=${personaId}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-white/90 transition-colors"
                            >
                                Kurulumu Başlat
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <button
                                onClick={() => setDismissed(true)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Şimdilik kapat"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Compact versiyonu (sidebar için)
export function PersonalitySetupMini({ personaId, setupCompleted }: PersonalitySetupBannerProps) {
    if (setupCompleted) return null;

    return (
        <Link
            href={`/dashboard/brain-setup/personality?personaId=${personaId}`}
            className="block p-3 mx-4 mb-2 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 hover:from-purple-200 hover:to-indigo-200 transition-colors"
        >
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Kişilik testi bekliyor</span>
            </div>
        </Link>
    );
}
