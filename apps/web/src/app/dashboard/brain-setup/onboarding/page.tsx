'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== TYPES ====================

interface OnboardingQuestion {
    questionId: string;
    question: string;
    options: { id: string; label: string; value: number; description?: string }[];
    category: string;
    icon: string;
}

// Note: OnboardingProgress type removed - using inline type

// ==================== QUESTIONS ====================

const QUESTIONS: OnboardingQuestion[] = [
    {
        questionId: 'communication_style',
        question: 'Bir konu anlatırken nasıl ilerlemeliyim?',
        category: 'İletişim Tarzı',
        icon: '💬',
        options: [
            { id: 'direct', label: 'Direkt', value: 0.8, description: 'Lafı dolandırma' },
            { id: 'analytical', label: 'Analitik', value: 0.9, description: 'Detaylı ve mantıklı' },
            { id: 'emotional', label: 'Duygusal', value: 0.2, description: 'Hislerle bağlantılı' },
            { id: 'storytelling', label: 'Hikâyeleştirerek', value: 0.4, description: 'Örneklerle anlat' }
        ]
    },
    {
        questionId: 'error_response',
        question: 'Bir hata yaptığımda ne yapmalıyım?',
        category: 'Geri Bildirim',
        icon: '🔄',
        options: [
            { id: 'correct', label: 'Düzelt', value: 0.8, description: 'Direkt hata de' },
            { id: 'question', label: 'Sorgula', value: 0.5, description: 'Neden öyle düşündüğümü sor' },
            { id: 'silent', label: 'Sessiz kal', value: 0.2, description: 'Üstüne gitme' },
            { id: 'warn', label: 'Uyar', value: 0.6, description: 'Nazikçe fark ettir' }
        ]
    },
    {
        questionId: 'response_length',
        question: 'Cevaplarım nasıl olsun?',
        category: 'Yanıt Tarzı',
        icon: '📝',
        options: [
            { id: 'brief', label: 'Kısa ve Öz', value: 80, description: 'Birkaç cümle yeterli' },
            { id: 'moderate', label: 'Dengeli', value: 150, description: 'Ne çok ne az' },
            { id: 'detailed', label: 'Detaylı', value: 250, description: 'Açıklayıcı ve kapsamlı' }
        ]
    },
    {
        questionId: 'disagreement_style',
        question: 'Seninle aynı fikirde olmadığımda...',
        category: 'Çatışma Yönetimi',
        icon: '⚖️',
        options: [
            { id: 'direct', label: 'Direkt söyle', value: 0.9, description: 'Açık ve net ol' },
            { id: 'diplomatic', label: 'Diplomatik', value: 0.5, description: 'Nazikçe belirt' },
            { id: 'question', label: 'Soru sor', value: 0.3, description: 'Anlamaya çalış' },
            { id: 'avoid', label: 'Kaçın', value: 0.1, description: 'Çatışmadan uzak dur' }
        ]
    },
    {
        questionId: 'emotional_support',
        question: 'Zor bir anında ne yapmalıyım?',
        category: 'Duygusal Destek',
        icon: '💙',
        options: [
            { id: 'listen', label: 'Sadece dinle', value: 0.8, description: 'Yanında ol' },
            { id: 'advice', label: 'Tavsiye ver', value: 0.4, description: 'Yol göster' },
            { id: 'practical', label: 'Çözüm sun', value: 0.3, description: 'Pratik ol' },
            { id: 'distract', label: 'Konu değiştir', value: 0.2, description: 'Rahatlatıcı ol' }
        ]
    },
    {
        questionId: 'question_frequency',
        question: 'Sana ne kadar soru sormalıyım?',
        category: 'Merak',
        icon: '❓',
        options: [
            { id: 'rarely', label: 'Nadiren', value: 1, description: 'Sadece gerektiğinde' },
            { id: 'sometimes', label: 'Bazen', value: 2, description: 'Ara sıra' },
            { id: 'often', label: 'Sık sık', value: 3, description: 'Meraklı ol' },
            { id: 'always', label: 'Sürekli', value: 4, description: 'Hep sorgula' }
        ]
    }
];

// ==================== COMPONENTS ====================

function ProgressBar({ current, total }: { current: number; total: number }) {
    const percentage = (current / total) * 100;

    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{current}/{total} tamamlandı</span>
                <span>%{Math.round(percentage)}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

function QuestionCard({
    question,
    onSelect,
    isActive
}: {
    question: OnboardingQuestion;
    onSelect: (optionId: string) => void;
    isActive: boolean;
}) {
    const [selected, setSelected] = useState<string | null>(null);

    const handleSelect = (optionId: string) => {
        setSelected(optionId);
        setTimeout(() => onSelect(optionId), 300);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isActive ? 1 : 0.3, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">{question.icon}</span>
                <span className="text-xs uppercase tracking-wider text-gray-500 block mb-2">
                    {question.category}
                </span>
                <h2 className="text-2xl font-bold text-white">
                    {question.question}
                </h2>
            </div>

            <div className="grid gap-3">
                {question.options.map((option, idx) => (
                    <motion.button
                        key={option.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSelect(option.id)}
                        className={`
                            relative p-4 rounded-xl text-left transition-all duration-300
                            ${selected === option.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200'}
                            border ${selected === option.id ? 'border-blue-400' : 'border-gray-700'}
                        `}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-semibold text-lg">{option.label}</span>
                                {option.description && (
                                    <p className="text-sm opacity-70 mt-1">{option.description}</p>
                                )}
                            </div>
                            <motion.div
                                initial={false}
                                animate={{ scale: selected === option.id ? 1 : 0 }}
                                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                            >
                                ✓
                            </motion.div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

function CompletionScreen({ personaId }: { personaId: string }) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-8xl mb-6"
            >
                🎉
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-4">
                İlk Temas Kuruldu.
            </h1>

            <p className="text-gray-400 max-w-md mx-auto mb-8">
                Bu tercihleri zihinsel çekirdeğe işledim.
                Artık seni anlamaya başlayabilirim.
            </p>

            <div className="space-y-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/dashboard/personas/${personaId}/chat`)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"
                >
                    Konuşmaya Başla →
                </motion.button>

                <p className="text-xs text-gray-500">
                    Tercihlerini istediğin zaman değiştirebilirsin
                </p>
            </div>
        </motion.div>
    );
}

// ==================== MAIN PAGE ====================

function OnboardingPageContent() {
    const searchParams = useSearchParams();
    const personaId = searchParams.get('personaId') || '';

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const currentQuestion = QUESTIONS[currentIndex];
    const progress = {
        current: currentIndex,
        total: QUESTIONS.length
    };

    const handleSelect = async (optionId: string) => {
        if (!personaId) {
            console.error('No personaId provided');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personaId,
                    questionId: currentQuestion.questionId,
                    selectedOptionId: optionId
                })
            });

            const data = await response.json();

            if (data.success) {
                setFeedback(data.feedback?.message || 'Tercih kaydedildi');

                setTimeout(() => {
                    setFeedback(null);
                    if (currentIndex < QUESTIONS.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                    } else {
                        setIsComplete(true);
                    }
                }, 800);
            }
        } catch (error) {
            console.error('Failed to save preference:', error);
        } finally {
            setIsLoading(false);
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
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
            <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-gray-950 to-purple-900/20 pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-sm uppercase tracking-widest text-gray-500 mb-2">
                        Kişilik Ayarları
                    </h1>
                    <p className="text-gray-400">
                        Bu tercihlere göre sana uyum sağlayacağım
                    </p>
                </motion.div>

                {!isComplete && <ProgressBar {...progress} />}

                <AnimatePresence mode="wait">
                    {isComplete ? (
                        <CompletionScreen key="complete" personaId={personaId} />
                    ) : (
                        <QuestionCard
                            key={currentQuestion.questionId}
                            question={currentQuestion}
                            onSelect={handleSelect}
                            isActive={!isLoading}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
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
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        }>
            <OnboardingPageContent />
        </Suspense>
    );
}
