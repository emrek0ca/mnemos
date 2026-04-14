'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Users, Heart, Scale, MessageCircle, BookOpen, Zap, Shield, Clock, Mic, Check } from 'lucide-react';
import type { PersonalityScenario, ScenarioOption } from '@/lib/personality/scenarios';

// Icon mapper
const ICONS = {
    brain: Brain,
    users: Users,
    heart: Heart,
    scale: Scale,
    'message-circle': MessageCircle,
    'book-open': BookOpen,
    zap: Zap,
    shield: Shield,
    clock: Clock,
    mic: Mic,
} as const;

interface ScenarioCardProps {
    scenario: PersonalityScenario;
    onSelect: (option: ScenarioOption) => void;
    disabled?: boolean;
}

export function ScenarioCard({ scenario, onSelect, disabled }: ScenarioCardProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleSelect = (option: ScenarioOption) => {
        if (disabled) return;
        setSelectedId(option.id);
        setTimeout(() => onSelect(option), 400);
    };

    const IconComponent = ICONS[scenario.iconName] || Brain;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl mx-auto"
        >
            {/* Kategori ve Başlık */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center"
                >
                    <IconComponent className="h-8 w-8 text-white" />
                </motion.div>
                <span className="text-xs uppercase tracking-widest text-slate-400 block mb-2">
                    {scenario.title}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed px-4">
                    {scenario.scenario}
                </h2>
            </div>

            {/* Seçenekler */}
            <div className="grid gap-3">
                {scenario.options.map((option, index) => {
                    const isSelected = selectedId === option.id;
                    const isHovered = hoveredId === option.id;

                    return (
                        <motion.button
                            key={option.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleSelect(option)}
                            onMouseEnter={() => setHoveredId(option.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            disabled={disabled || selectedId !== null}
                            className={`
                                relative p-4 md:p-5 rounded-xl text-left transition-all duration-300
                                ${isSelected
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-400'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <span className="font-semibold text-base md:text-lg block">
                                        {option.label}
                                    </span>
                                    <AnimatePresence>
                                        {(isHovered || isSelected) && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={`text-sm mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}
                                            >
                                                {option.description}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Seçim göstergesi */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isSelected ? 1 : 0,
                                        opacity: isSelected ? 1 : 0
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
                                >
                                    <Check className="w-5 h-5 text-white" />
                                </motion.div>
                            </div>

                            {/* Hover indicator */}
                            {!isSelected && isHovered && (
                                <motion.div
                                    layoutId="hover-indicator"
                                    className="absolute inset-0 rounded-xl border-2 border-slate-400 pointer-events-none"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Etki önizlemesi (seçildikten sonra) */}
            <AnimatePresence>
                {selectedId && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 text-center"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                            <Check className="w-4 h-4" />
                            Profil güncelleniyor...
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Mini senaryo önizleme kartı (liste görünümü için)
interface ScenarioPreviewProps {
    scenario: PersonalityScenario;
    completed: boolean;
    onClick?: () => void;
}

export function ScenarioPreview({ scenario, completed, onClick }: ScenarioPreviewProps) {
    const IconComponent = ICONS[scenario.iconName] || Brain;

    return (
        <button
            onClick={onClick}
            disabled={completed}
            className={`
                w-full p-4 rounded-lg text-left transition-all
                ${completed
                    ? 'bg-slate-100 border border-slate-200'
                    : 'bg-white border border-slate-200 hover:border-slate-400 hover:shadow-sm'
                }
            `}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                    <span className="font-medium text-slate-900">{scenario.title}</span>
                    <p className="text-xs text-slate-500 line-clamp-1">{scenario.scenario}</p>
                </div>
                {completed && (
                    <Check className="w-5 h-5 text-slate-600" />
                )}
            </div>
        </button>
    );
}
