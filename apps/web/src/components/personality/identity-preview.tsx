'use client';

import { motion } from 'framer-motion';
import { Brain, Zap, Users, Heart, Target, MessageCircle, Lightbulb, Shield } from 'lucide-react';

interface PersonalityProfile {
    // Big Five
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    // Cognitive
    decisionSpeed: number;
    logicVsEmotion: number;
    // Core
    dominance: number;
    empathy: number;
}

interface IdentityPreviewProps {
    profile: PersonalityProfile;
    name?: string;
}

export function IdentityPreview({ profile, name }: IdentityPreviewProps) {
    const summary = generatePersonalitySummary(profile);
    const traits = extractKeyTraits(profile);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800"
        >
            {/* Başlık */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">{name || 'Kişilik Profili'}</h3>
                    <p className="text-sm text-slate-400">Bilişsel Özet</p>
                </div>
            </div>

            {/* Özet Cümle */}
            <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                <p className="text-sm leading-relaxed text-slate-300 italic">
                    &quot;{summary}&quot;
                </p>
            </div>

            {/* Öne Çıkan Özellikler */}
            <div className="flex flex-wrap gap-2">
                {traits.map((trait, index) => {
                    const IconComponent = trait.Icon;
                    return (
                        <motion.span
                            key={trait.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10"
                        >
                            <IconComponent className="w-3 h-3" />
                            {trait.label}
                        </motion.span>
                    );
                })}
            </div>
        </motion.div>
    );
}

// Kişilik özet cümlesi oluştur
function generatePersonalitySummary(profile: PersonalityProfile): string {
    const parts: string[] = [];

    // Düşünme tarzı
    if (profile.logicVsEmotion > 0.6) {
        parts.push('analitik düşünen');
    } else if (profile.logicVsEmotion < 0.4) {
        parts.push('sezgisel ve duygusal');
    } else {
        parts.push('dengeli bir perspektife sahip');
    }

    // Sosyal eğilim
    if (profile.extraversion > 0.6) {
        parts.push('sosyal ve enerjik');
    } else if (profile.extraversion < 0.4) {
        parts.push('içe dönük ve düşünceli');
    }

    // Karar tarzı
    if (profile.decisionSpeed > 0.6) {
        parts.push('hızlı karar alabilen');
    } else if (profile.decisionSpeed < 0.4) {
        parts.push('temkinli ve dikkatli');
    }

    // Empati
    if (profile.empathy > 0.7) {
        parts.push('yüksek empati kapasiteli');
    }

    // Açıklık
    if (profile.openness > 0.7) {
        parts.push('yeni deneyimlere açık');
    } else if (profile.openness < 0.3) {
        parts.push('geleneksel değerlere bağlı');
    }

    // Düzen
    if (profile.conscientiousness > 0.7) {
        parts.push('düzenli ve planlı');
    }

    // Baskınlık
    if (profile.dominance > 0.7) {
        parts.push('liderlik eğilimli');
    } else if (profile.dominance < 0.3) {
        parts.push('uyumlu ve destekleyici');
    }

    // Cümle oluştur
    if (parts.length === 0) {
        return 'Dengeli bir kişilik yapısına sahip, farklı durumlara uyum sağlayabilen biri.';
    }

    const firstPart = parts.slice(0, 2).join(', ');
    const restParts = parts.slice(2);

    if (restParts.length === 0) {
        return `${capitalize(firstPart)} biri.`;
    }

    return `${capitalize(firstPart)} biri. ${restParts.map(p => capitalize(p)).join('. ')}.`;
}

// Öne çıkan özellikleri çıkar
function extractKeyTraits(profile: PersonalityProfile): { label: string; Icon: typeof Brain }[] {
    const traits: { label: string; Icon: typeof Brain; score: number }[] = [];

    // Big Five bazlı
    if (profile.openness > 0.65) {
        traits.push({ label: 'Yaratıcı', Icon: Lightbulb, score: profile.openness });
    }
    if (profile.conscientiousness > 0.65) {
        traits.push({ label: 'Düzenli', Icon: Target, score: profile.conscientiousness });
    }
    if (profile.extraversion > 0.65) {
        traits.push({ label: 'Sosyal', Icon: Users, score: profile.extraversion });
    }
    if (profile.agreeableness > 0.65) {
        traits.push({ label: 'Uyumlu', Icon: Shield, score: profile.agreeableness });
    }
    if (profile.neuroticism > 0.65) {
        traits.push({ label: 'Hassas', Icon: Heart, score: profile.neuroticism });
    }

    // Cognitive
    if (profile.decisionSpeed > 0.65) {
        traits.push({ label: 'Hızlı', Icon: Zap, score: profile.decisionSpeed });
    }
    if (profile.logicVsEmotion > 0.7) {
        traits.push({ label: 'Analitik', Icon: Brain, score: profile.logicVsEmotion });
    }

    // Core
    if (profile.dominance > 0.65) {
        traits.push({ label: 'Lider', Icon: Target, score: profile.dominance });
    }
    if (profile.empathy > 0.7) {
        traits.push({ label: 'Empatik', Icon: MessageCircle, score: profile.empathy });
    }

    // En yüksek 5 özelliği döndür
    return traits
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ label, Icon }) => ({ label, Icon }));
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
