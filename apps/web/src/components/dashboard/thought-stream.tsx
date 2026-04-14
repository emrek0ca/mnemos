'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain, Sparkles, AlertCircle, MessageCircle, X, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Thought {
    content: string;
    topic: string;
    mood: string;
    urgency: number;
    proactive_message?: string;
    timestamp: Date;
}

// Mood to color mapping
const MOOD_COLORS: Record<string, string> = {
    'analytical': 'bg-blue-100 border-blue-300 text-blue-800',
    'curious': 'bg-purple-100 border-purple-300 text-purple-800',
    'reflective': 'bg-amber-100 border-amber-300 text-amber-800',
    'planning': 'bg-green-100 border-green-300 text-green-800',
    'existential': 'bg-slate-100 border-slate-300 text-slate-800',
    'default': 'bg-white border-slate-200 text-slate-700'
};

interface ThoughtStreamProps {
    onProactiveReply?: (message: string) => void;
}

export function ThoughtStream({ onProactiveReply }: ThoughtStreamProps) {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [dismissedProactive, setDismissedProactive] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(triggerThink, 5000);
        const interval = setInterval(triggerThink, 30000);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    async function triggerThink() {
        setLoading(true);
        try {
            const response = await fetch('/api/thought-loop', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                if (data.thought) {
                    const newThought = { ...data.thought, timestamp: new Date() };
                    setThoughts(prev => [newThought, ...prev].slice(0, 10));
                    setDismissedProactive(false); // Reset on new proactive

                    // Trigger sound/notification if proactive
                    if (newThought.proactive_message) {
                        console.log("Proactive Message:", newThought.proactive_message);
                    }
                }
            }
        } catch (error) {
            console.error('Thought loop error:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleReply = useCallback(() => {
        const proactiveMessage = thoughts[0]?.proactive_message;
        if (proactiveMessage && onProactiveReply) {
            onProactiveReply(proactiveMessage);
            setDismissedProactive(true);
        }
    }, [thoughts, onProactiveReply]);

    const handleDismiss = useCallback(() => {
        setDismissedProactive(true);
    }, []);

    const getMoodColor = (mood: string) => {
        const key = mood.toLowerCase();
        return MOOD_COLORS[key] || MOOD_COLORS.default;
    };

    if (thoughts.length === 0 && !loading) return null;

    const latestThought = thoughts[0];
    const showProactive = latestThought?.proactive_message && !dismissedProactive;

    return (
        <div className="hidden md:flex fixed bottom-24 right-4 md:right-8 z-30 w-80 pointer-events-none flex-col gap-3 items-end">
            {/* Proactive Message Alert with Reply Button */}
            {showProactive && (
                <div className="pointer-events-auto bg-gradient-to-br from-indigo-600 to-purple-700 backdrop-blur-md text-white shadow-2xl rounded-2xl p-4 max-w-[320px] animate-in slide-in-from-bottom-10 border border-indigo-400/30">
                    <div className="flex items-start gap-3">
                        <div className="bg-white/20 p-2 rounded-full mt-1 flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold mb-1 text-indigo-50">Bir fikrim var...</p>
                            <p className="text-sm leading-relaxed text-indigo-100">
                                &quot;{latestThought.proactive_message}&quot;
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={handleReply}
                                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    Yanıtla
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="flex items-center gap-1 text-white/60 hover:text-white/90 text-xs px-2 py-1.5 rounded-lg transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Toggle */}
            {thoughts.length > 1 && (
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="pointer-events-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-slate-200 transition-colors"
                >
                    <History className="h-3 w-3" />
                    {showHistory ? 'Gizle' : `${thoughts.length} düşünce`}
                </button>
            )}

            {/* Thought Stream */}
            <div className="flex flex-col gap-2 items-end">
                {(showHistory ? thoughts : thoughts.slice(0, 2)).map((thought, i) => (
                    <div
                        key={thought.timestamp.getTime()}
                        className={cn(
                            "backdrop-blur-md border shadow-lg rounded-xl p-3 max-w-[300px] pointer-events-auto transition-all duration-500 animate-in slide-in-from-right-4 fade-in",
                            getMoodColor(thought.mood),
                            i === 0 ? "opacity-100 scale-100" : "opacity-70 scale-95 origin-bottom-right"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Brain className={cn("h-3 w-3", loading && i === 0 && "animate-pulse")} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{thought.mood}</span>
                            <span className="text-[10px] opacity-60">• {thought.topic}</span>
                            {thought.urgency > 0.7 && (
                                <AlertCircle className="h-3 w-3 text-red-500 ml-auto" />
                            )}
                        </div>
                        <p className="text-xs leading-relaxed font-medium italic">
                            &quot;{thought.content}&quot;
                        </p>
                        <p className="text-[10px] opacity-50 mt-1">
                            {thought.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
