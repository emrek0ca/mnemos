'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== TYPES ====================

interface CorrectionOption {
    id: string;
    label: string;
    icon: string;
}

interface MicroFeedbackProps {
    personaId: string;
    messageId: string;
    onFeedbackSent?: (feedback: string) => void;
}

// ==================== CORRECTION OPTIONS ====================

const CORRECTION_OPTIONS: CorrectionOption[] = [
    { id: 'too_long', label: 'Çok uzun', icon: '📏' },
    { id: 'too_short', label: 'Çok kısa', icon: '📎' },
    { id: 'too_formal', label: 'Çok resmi', icon: '👔' },
    { id: 'too_casual', label: 'Çok laubali', icon: '🎭' },
    { id: 'wrong_approach', label: 'Yaklaşım yanlış', icon: '🔄' },
    { id: 'misunderstood', label: 'Yanlış anladın', icon: '❓' }
];

const QUICK_ACTIONS = [
    { id: 'keep', label: 'Bunu hatırla', icon: '💾' },
    { id: 'important', label: 'Önemli', icon: '⭐' },
    { id: 'forget', label: 'Unut', icon: '🗑️' }
];

// ==================== COMPONENTS ====================

export function ChatMicroFeedback({ personaId, messageId, onFeedbackSent }: MicroFeedbackProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const sendFeedback = async (type: 'correction' | 'control', action: string) => {
        setIsSending(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personaId,
                    feedbackType: type,
                    action,
                    targetId: messageId,
                    targetType: 'memory'
                })
            });

            const data = await response.json();

            if (data.success) {
                setFeedbackMessage(data.feedback?.message || 'Kaydedildi');
                onFeedbackSent?.(data.feedback?.message);

                setTimeout(() => {
                    setFeedbackMessage(null);
                    setIsOpen(false);
                }, 1500);
            }
        } catch (error) {
            console.error('Failed to send feedback:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
                title="Geri bildirim"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
            </button>

            {/* Feedback Popup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 w-72 bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden z-50"
                    >
                        {feedbackMessage ? (
                            <div className="p-4 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-3xl mb-2"
                                >
                                    ✓
                                </motion.div>
                                <p className="text-white">{feedbackMessage}</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-3 border-b border-gray-700">
                                    <h4 className="text-white text-sm font-medium">Nasıldı?</h4>
                                    <p className="text-gray-500 text-xs">Geri bildirim sistem davranışını şekillendirir</p>
                                </div>

                                {/* Corrections */}
                                <div className="p-2">
                                    <p className="text-gray-500 text-xs px-2 mb-2">Düzeltme</p>
                                    <div className="grid grid-cols-2 gap-1">
                                        {CORRECTION_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => sendFeedback('correction', opt.id)}
                                                disabled={isSending}
                                                className="flex items-center gap-2 p-2 rounded-lg text-left text-sm text-gray-300 hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                                            >
                                                <span>{opt.icon}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="p-2 border-t border-gray-700">
                                    <p className="text-gray-500 text-xs px-2 mb-2">Hızlı İşlem</p>
                                    <div className="flex gap-1">
                                        {QUICK_ACTIONS.map(act => (
                                            <button
                                                key={act.id}
                                                onClick={() => sendFeedback('control', act.id)}
                                                disabled={isSending}
                                                className="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                                            >
                                                <span>{act.icon}</span>
                                                <span className="text-xs">{act.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ==================== EVOLUTION MESSAGE COMPONENT ====================

export function EvolutionMessage({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-sm"
        >
            <span className="text-purple-400">💡</span>
            <p className="text-purple-200 italic">{message}</p>
        </motion.div>
    );
}

// ==================== FEEDBACK TOAST ====================

export function FeedbackToast({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            onAnimationComplete={() => setTimeout(onClose, 2000)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg z-50"
        >
            ✓ {message}
        </motion.div>
    );
}

// ==================== DISAGREEMENT DETECTOR ====================

export function useDisagreementDetector() {
    const disagreementPatterns = [
        /hayır/i,
        /yanlış/i,
        /katılmıyorum/i,
        /öyle değil/i,
        /saçma/i,
        /no/i,
        /wrong/i,
        /disagree/i
    ];

    const detectDisagreement = (text: string): boolean => {
        return disagreementPatterns.some(pattern => pattern.test(text));
    };

    return { detectDisagreement };
}

// ==================== EXPORTS ====================

export default ChatMicroFeedback;
