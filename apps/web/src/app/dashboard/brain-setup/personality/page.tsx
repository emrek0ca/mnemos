'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Users, Heart, Scale, MessageCircle, Dna, Sparkles, Check, ArrowRight } from 'lucide-react';
import { PERSONALITY_SCENARIOS, type ScenarioOption } from '@/lib/personality/scenarios';
import { ScenarioCard } from '@/components/personality/scenario-card';
import { PersonalityRadar, fullProfileToRadarData } from '@/components/personality/personality-radar';
import { IdentityPreview } from '@/components/personality/identity-preview';

// Profil tipi
interface PersonalityProfile {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    decisionSpeed: number;
    abstractThinking: number;
    pastVsFuture: number;
    detailOrientation: number;
    dominance: number;
    empathy: number;
    logicVsEmotion: number;
    angerThreshold: number;
    criticismResponse: number;
    stressResponse: number;
}

const DEFAULT_PROFILE: PersonalityProfile = {
    openness: 0.5,
    conscientiousness: 0.5,
    extraversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5,
    decisionSpeed: 0.5,
    abstractThinking: 0.5,
    pastVsFuture: 0.5,
    detailOrientation: 0.5,
    dominance: 0.5,
    empathy: 0.5,
    logicVsEmotion: 0.5,
    angerThreshold: 0.5,
    criticismResponse: 0.5,
    stressResponse: 0.5,
};

// Adım bilgileri - icon component yerine iconName kullanıyoruz
const STEPS = [
    { id: 'intro', label: 'Başlangıç', Icon: Dna },
    { id: 'cognitive', label: 'Bilişsel', Icon: Brain },
    { id: 'social', label: 'Sosyal', Icon: Users },
    { id: 'emotional', label: 'Duygusal', Icon: Heart },
    { id: 'decision', label: 'Kararlar', Icon: Scale },
    { id: 'communication', label: 'İletişim', Icon: MessageCircle },
    { id: 'review', label: 'Özet', Icon: Sparkles },
];

function PersonalityWizardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryPersonaId = searchParams.get('personaId');

    const [personaId, setPersonaId] = useState<string>(queryPersonaId || '');
    const [currentStep, setCurrentStep] = useState(0);
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
    const [profile, setProfile] = useState<PersonalityProfile>(DEFAULT_PROFILE);
    const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [personaName, setPersonaName] = useState('');
    const [loading, setLoading] = useState(true);

    // Mevcut kişilik profili durumu
    const [existingDNA, setExistingDNA] = useState<PersonalityProfile | null>(null);
    const [isSetupCompleted, setIsSetupCompleted] = useState(false);
    const [showWizard, setShowWizard] = useState(false); // Tekrar test yapmak isteyenler için

    // Eğer personaId yoksa, kullanıcının ilk personasını çek
    useEffect(() => {
        async function loadPersonaAndDNA() {
            try {
                let targetPersonaId = queryPersonaId;
                let targetPersonaName = '';

                // Eğer personaId yoksa, ilk persona'yı al
                if (!queryPersonaId) {
                    const res = await fetch('/api/personas');
                    const data = await res.json();
                    const firstPersona = data.personas?.[0];
                    if (firstPersona) {
                        targetPersonaId = firstPersona.id;
                        targetPersonaName = firstPersona.name;
                    } else {
                        router.push('/dashboard');
                        return;
                    }
                }

                setPersonaId(targetPersonaId || '');

                // Persona adını çek (eğer yoksa)
                if (!targetPersonaName && targetPersonaId) {
                    try {
                        const personaRes = await fetch(`/api/personas/${targetPersonaId}`);
                        if (personaRes.ok) {
                            const personaData = await personaRes.json();
                            targetPersonaName = personaData.persona?.name || '';
                        }
                    } catch {
                        // Ignore
                    }
                }
                setPersonaName(targetPersonaName);

                // Mevcut PersonalityDNA'yı kontrol et
                if (targetPersonaId) {
                    const dnaRes = await fetch(`/api/personality-dna?personaId=${targetPersonaId}`);
                    if (dnaRes.ok) {
                        const dnaData = await dnaRes.json();
                        if (dnaData.personalityDNA && dnaData.personalityDNA.setupCompleted) {
                            // Mevcut profili yükle
                            const dna = dnaData.personalityDNA;
                            setExistingDNA({
                                openness: dna.openness,
                                conscientiousness: dna.conscientiousness,
                                extraversion: dna.extraversion,
                                agreeableness: dna.agreeableness,
                                neuroticism: dna.neuroticism,
                                decisionSpeed: dna.decisionSpeed,
                                abstractThinking: dna.abstractThinking,
                                pastVsFuture: dna.pastVsFuture,
                                detailOrientation: dna.detailOrientation,
                                dominance: dna.dominance,
                                empathy: dna.empathy,
                                logicVsEmotion: dna.logicVsEmotion,
                                angerThreshold: dna.angerThreshold,
                                criticismResponse: dna.criticismResponse,
                                stressResponse: dna.stressResponse,
                            });
                            setProfile({
                                openness: dna.openness,
                                conscientiousness: dna.conscientiousness,
                                extraversion: dna.extraversion,
                                agreeableness: dna.agreeableness,
                                neuroticism: dna.neuroticism,
                                decisionSpeed: dna.decisionSpeed,
                                abstractThinking: dna.abstractThinking,
                                pastVsFuture: dna.pastVsFuture,
                                detailOrientation: dna.detailOrientation,
                                dominance: dna.dominance,
                                empathy: dna.empathy,
                                logicVsEmotion: dna.logicVsEmotion,
                                angerThreshold: dna.angerThreshold,
                                criticismResponse: dna.criticismResponse,
                                stressResponse: dna.stressResponse,
                            });
                            setIsSetupCompleted(true);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading persona/DNA:', error);
            } finally {
                setLoading(false);
            }
        }

        loadPersonaAndDNA();
    }, [queryPersonaId, router]);

    // Mevcut adımın senaryoları
    const currentStepId = STEPS[currentStep]?.id;
    const currentScenarios = currentStepId && currentStepId !== 'intro' && currentStepId !== 'review'
        ? PERSONALITY_SCENARIOS.filter(s => s.category === currentStepId)
        : [];
    const currentScenario = currentScenarios[currentScenarioIndex];

    // Seçim yapıldığında profili güncelle
    const handleScenarioSelect = useCallback((option: ScenarioOption) => {
        // Profili güncelle (impact'leri uygula)
        setProfile(prev => {
            const updated = { ...prev };
            Object.entries(option.impact).forEach(([key, value]) => {
                if (key in updated && typeof value === 'number') {
                    // Mevcut değeri %70, yeni değeri %30 etkilesin
                    const currentVal = updated[key as keyof PersonalityProfile] as number;
                    updated[key as keyof PersonalityProfile] = currentVal * 0.7 + value * 0.3;
                }
            });
            return updated;
        });

        // Tamamlanan senaryo olarak işaretle
        if (currentScenario) {
            setCompletedScenarios(prev => new Set([...prev, currentScenario.id]));
        }

        // Sonraki senaryo veya adıma geç
        setTimeout(() => {
            if (currentScenarioIndex < currentScenarios.length - 1) {
                setCurrentScenarioIndex(prev => prev + 1);
            } else {
                // Sonraki adıma geç
                setCurrentScenarioIndex(0);
                setCurrentStep(prev => prev + 1);
            }
        }, 600);
    }, [currentScenario, currentScenarioIndex, currentScenarios.length]);

    // Profili kaydet
    const saveProfile = async () => {
        if (!personaId) return;

        setSaving(true);
        try {
            // PersonalityDNA tablosuna kaydet (upsert)
            const response = await fetch('/api/personality-dna', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personaId,
                    ...profile,
                    setupCompleted: true,
                    setupStep: STEPS.length
                })
            });

            if (response.ok) {
                router.push('/dashboard');
            } else {
                const data = await response.json();
                console.error('Profile save failed:', data.error);
                alert('Profil kaydedilemedi: ' + (data.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Profile save failed:', error);
            alert('Profil kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    // Adım atlama
    const skipToReview = () => {
        setCurrentStep(STEPS.length - 1);
    };

    // Progress hesapla
    const totalScenarios = PERSONALITY_SCENARIOS.length;
    const completedCount = completedScenarios.size;
    const progressPercent = (completedCount / totalScenarios) * 100;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full" />
                    <p className="text-slate-500">Profil yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!personaId) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-500 mb-4">Persona bulunamadı</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                        Dashboard&apos;a Dön
                    </button>
                </div>
            </div>
        );
    }

    // Mevcut profil tamamlanmış ve wizard gösterilmiyorsa özet görünümünü göster
    if (isSetupCompleted && !showWizard && existingDNA) {
        return (
            <div className="min-h-screen bg-white">
                {/* Header */}
                <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                                <Dna className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-900">Kişilik Profili</h1>
                                <p className="text-sm text-slate-500">{personaName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Tamamlandı
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Summary Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Radar Chart */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                    Kişilik Haritası
                                </h3>
                                <div className="flex items-center justify-center">
                                    <PersonalityRadar
                                        data={fullProfileToRadarData(existingDNA)}
                                        size={260}
                                        color="#1e293b"
                                    />
                                </div>
                            </div>

                            {/* Identity Preview */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                    Kimlik Özeti
                                </h3>
                                <IdentityPreview
                                    profile={existingDNA}
                                    name={personaName}
                                />
                            </div>
                        </div>

                        {/* Trait Details */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
                                Detaylı Özellikler
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Açıklık', value: existingDNA.openness, icon: Sparkles },
                                    { label: 'Sorumluluk', value: existingDNA.conscientiousness, icon: Scale },
                                    { label: 'Dışadönüklük', value: existingDNA.extraversion, icon: Users },
                                    { label: 'Uyumluluk', value: existingDNA.agreeableness, icon: Heart },
                                    { label: 'Duygusallık', value: existingDNA.neuroticism, icon: Heart },
                                    { label: 'Empati', value: existingDNA.empathy, icon: Heart },
                                    { label: 'Karar Hızı', value: existingDNA.decisionSpeed, icon: Brain },
                                    { label: 'Soyut Düşünce', value: existingDNA.abstractThinking, icon: Brain },
                                    { label: 'Detay Odaklılık', value: existingDNA.detailOrientation, icon: Brain },
                                ].map((trait) => (
                                    <div key={trait.label} className="p-3 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <trait.icon className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-600">{trait.label}</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-700 rounded-full transition-all duration-500"
                                                style={{ width: `${trait.value * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-right text-xs text-slate-500 mt-1">
                                            {Math.round(trait.value * 100)}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Dashboard&apos;a Dön
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setShowWizard(true);
                                    setCurrentStep(0);
                                    setProfile(DEFAULT_PROFILE);
                                    setCompletedScenarios(new Set());
                                }}
                                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Yeniden Test Et
                            </motion.button>
                        </div>

                        <p className="text-center text-xs text-slate-400">
                            Kişilik profilinizi istediğiniz zaman güncelleyebilirsiniz.
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
                <motion.div
                    className="h-full bg-slate-900"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Header */}
            <div className="fixed top-4 left-4 right-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-2">
                    {STEPS.map((step, index) => {
                        const StepIcon = step.Icon;
                        return (
                            <div
                                key={step.id}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${index === currentStep
                                    ? 'bg-slate-900 text-white scale-110'
                                    : index < currentStep
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-200 text-slate-400'
                                    }`}
                            >
                                {index < currentStep ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <StepIcon className="w-4 h-4" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                    <button
                        onClick={skipToReview}
                        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                        Atla <ArrowRight className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="pt-20 pb-16 px-4 min-h-screen flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {/* Intro Step */}
                    {currentStep === 0 && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center max-w-lg"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-900 flex items-center justify-center"
                            >
                                <Dna className="h-10 w-10 text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-4">
                                Kişilik Profilini Keşfet
                            </h1>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                Sana birkaç senaryo sunacağız. Cevapların, dijital ikizinin
                                kişilik temelini oluşturacak. Doğru veya yanlış cevap yok —
                                sadece sen ol.
                            </p>
                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setCurrentStep(1)}
                                    className="w-full px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    Başlayalım
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>
                                <p className="text-xs text-slate-400">
                                    Yaklaşık 3-5 dakika sürecek
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Scenario Steps */}
                    {currentStep > 0 && currentStep < STEPS.length - 1 && currentScenario && (
                        <div key={`scenario-${currentScenario.id}`}>
                            <ScenarioCard
                                scenario={currentScenario}
                                onSelect={handleScenarioSelect}
                            />
                        </div>
                    )}

                    {/* Review Step */}
                    {currentStep === STEPS.length - 1 && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-3xl mx-auto"
                        >
                            <div className="text-center mb-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring' }}
                                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center"
                                >
                                    <Sparkles className="h-8 w-8 text-white" />
                                </motion.div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Kişilik Profilin Hazır
                                </h1>
                                <p className="text-slate-600">
                                    İşte dijital ikizinin temel özellikleri
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {/* Radar Chart */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-center">
                                    <PersonalityRadar
                                        data={fullProfileToRadarData(profile)}
                                        size={260}
                                        color="#1e293b"
                                    />
                                </div>

                                {/* Identity Preview */}
                                <IdentityPreview
                                    profile={profile}
                                    name={personaName}
                                />
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        setCurrentStep(1);
                                        setCurrentScenarioIndex(0);
                                        setCompletedScenarios(new Set());
                                        setProfile(DEFAULT_PROFILE);
                                    }}
                                    className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Baştan Başla
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? 'Kaydediliyor...' : 'Onayla ve Bitir'}
                                    {!saving && <Check className="w-4 h-4" />}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function PersonalityWizardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        }>
            <PersonalityWizardContent />
        </Suspense>
    );
}
