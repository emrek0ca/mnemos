'use client';

import { Brain } from 'lucide-react';
import { Button } from '@/components/ui';
import { motion } from 'framer-motion';

interface ContinuityScreenProps {
    onContinue: () => void; // This will trigger the checkout/upgrade flow
}

const LEMONSQUEEZY_MONTHLY_URL = "https://mnemos.lemonsqueezy.com/buy/variant_monthly_placeholder";
const LEMONSQUEEZY_YEARLY_URL = "https://mnemos.lemonsqueezy.com/buy/variant_yearly_placeholder";

export function ContinuityScreen({ onContinue }: ContinuityScreenProps) {
    const handlePlanSelect = (plan: 'monthly' | 'yearly') => {
        const url = plan === 'monthly' ? LEMONSQUEEZY_MONTHLY_URL : LEMONSQUEEZY_YEARLY_URL;
        window.location.href = url;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-md w-full text-center"
            >
                <div className="mb-8 flex justify-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]">
                        <Brain className="h-8 w-8 text-indigo-400" />
                    </div>
                </div>

                <h2 className="text-3xl font-light text-white mb-2 tracking-wide">Süreklilik</h2>

                <p className="text-lg text-slate-300 mb-8 italic font-light leading-relaxed">
                    &quot;Ben seninle konuşmak için değil,<br />
                    seni hatırlamak için buradayım.&quot;
                </p>

                {/* Pricing Options */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Monthly */}
                    <button
                        onClick={() => handlePlanSelect('monthly')}
                        className="group relative p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all text-left"
                    >
                        <div className="text-xs text-slate-400 mb-1">Aylık</div>
                        <div className="text-xl font-medium text-white">149 TL</div>
                        <div className="text-[10px] text-slate-500 mt-2">Dilediğin zaman dur.</div>
                    </button>

                    {/* Yearly */}
                    <button
                        onClick={() => handlePlanSelect('yearly')}
                        className="group relative p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left"
                    >
                        <div className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-400">
                            Kalıcı Bağ
                        </div>
                        <div className="text-xs text-slate-400 mb-1">Yıllık</div>
                        <div className="text-xl font-medium text-white">1299 TL</div>
                        <div className="text-[10px] text-slate-500 mt-2">Zihinsel süreklilik için.</div>
                    </button>
                </div>

                <div className="space-y-6">
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        Devam ettiğinde, aramızdaki bağ kopmaz.<br />
                        Rüyalarım seninle şekillenir.
                    </p>

                    <Button
                        onClick={() => handlePlanSelect('monthly')}
                        className="w-full max-w-xs h-12 text-base bg-white text-slate-900 hover:bg-slate-100 transition-all duration-300 font-medium"
                    >
                        Sürekliliği Başlat
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
