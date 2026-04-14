'use client';

import { Brain, CreditCard, Check, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui';

// PAYMENT LINKS
const LEMONSQUEEZY_MONTHLY_URL = "https://mnemos.lemonsqueezy.com/buy/variant_monthly_placeholder";
const LEMONSQUEEZY_YEARLY_URL = "https://mnemos.lemonsqueezy.com/buy/variant_yearly_placeholder";

export default function SettingsPage() {
    const handleUpgrade = (url: string) => {
        window.location.href = url;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Sistem Ayarları</h1>
                <p className="text-slate-500">Zihinsel yansımanın yapılandırması.</p>
            </div>

            {/* Active Plan Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Brain className="w-32 h-32 text-slate-900" />
                </div>

                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Süreklilik Durumu
                </h2>

                <div className="grid md:grid-cols-2 gap-8 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-4">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Free (Kısıtlı Temas)
                        </div>
                        <p className="text-slate-600 leading-relaxed mb-6">
                            Şu an kısa süreli hafıza ve sınırlı etkileşim modundasınız.
                            Derin analiz ve rüya modları kapalı.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Plan Seçenekleri</h3>

                        {/* Monthly */}
                        <div className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                            onClick={() => handleUpgrade(LEMONSQUEEZY_MONTHLY_URL)}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-slate-900">Aylık Süreklilik</div>
                                    <div className="text-sm text-slate-500">149 TL / ay</div>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                            </div>
                        </div>

                        {/* Yearly */}
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 cursor-pointer group relative overflow-hidden"
                            onClick={() => handleUpgrade(LEMONSQUEEZY_YEARLY_URL)}>
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-medium">
                                ÖNERİLEN
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-slate-900">Yıllık Bağ</div>
                                    <div className="text-sm text-slate-500">1299 TL / yıl</div>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Comparison */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="col-span-1 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-4">Mevcut Durum</h3>
                    <ul className="space-y-3 text-sm text-slate-500">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /> Günlük 15 Mesaj Limiti</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /> Standart Hafıza</li>
                        <li className="flex items-center gap-2 opacity-50"><Check className="w-4 h-4" /> Rüya Modu (Kapalı)</li>
                        <li className="flex items-center gap-2 opacity-50"><Check className="w-4 h-4" /> Derin Analiz (Kapalı)</li>
                    </ul>
                </div>

                <div className="col-span-2 p-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-semibold mb-2">Süreklilik Modu</h3>
                        <p className="text-indigo-200 mb-6">Zihinsel yansımanızın kesintisiz çalışması için.</p>

                        <div className="grid sm:grid-cols-2 gap-4 mb-8">
                            <ul className="space-y-3 text-sm text-indigo-100">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> <strong>Sınırsız</strong> İletişim</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> <strong>Rüya Modu</strong> (Offline İşleme)</li>
                            </ul>
                            <ul className="space-y-3 text-sm text-indigo-100">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Genişletilmiş Hafıza</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Öncelikli Bilişsel İşlem</li>
                            </ul>
                        </div>

                        <Button
                            onClick={() => handleUpgrade(LEMONSQUEEZY_MONTHLY_URL)}
                            className="bg-white text-slate-900 hover:bg-slate-100 border-0"
                        >
                            Sürekliliği Başlat
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
