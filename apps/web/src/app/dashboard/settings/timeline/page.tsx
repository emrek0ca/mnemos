'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { History, Activity } from 'lucide-react';
import DriftCharts from '@/components/dashboard/drift-charts';

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
}

export default function TimelinePage() {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/timeline');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events || []);
                }
            } catch (error) {
                console.error('Failed to fetch timeline:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Zaman Çizelgesi & Evrim</h1>
                <p className="text-slate-600 mt-1">Kimlik değişimleri ve önemli olaylar</p>
            </div>

            {/* Drift Charts Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Kişilik Sürüklenmesi (Drift)
                </h2>
                <DriftCharts />
            </div>

            {/* Timeline Events List */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Olay Günlüğü
                </h2>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {events.map((event) => (
                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                            {/* Icon */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <div className={`w-3 h-3 rounded-full ${event.type === 'identity_change' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                            </div>

                            {/* Content */}
                            <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-slate-800 text-sm">{event.title}</h3>
                                    <time className="text-xs text-slate-400 font-medium">
                                        {new Date(event.timestamp).toLocaleDateString()}
                                    </time>
                                </div>

                                {event.metadata?.details ? (
                                    <div className="mt-2 text-sm text-slate-600">
                                        {event.metadata.details.cognitiveMode && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${event.metadata.details.cognitiveMode === 'INTUITIVE'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {event.metadata.details.cognitiveMode}
                                                </span>
                                                {event.metadata.details.emotionIntensity > 0 && (
                                                    <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        Yoğunluk: {Math.round(event.metadata.details.emotionIntensity * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {event.metadata.details.topic && (
                                            <div className="mb-1">
                                                <span className="text-slate-500">Konu:</span> {event.metadata.details.topic}
                                            </div>
                                        )}

                                        {event.metadata.details.learningApplied && (
                                            <div className="text-green-600 text-xs mt-2 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Öğrenme uygulandı
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {event.description}
                                    </p>
                                )}
                            </Card>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <div className="text-center text-slate-400 py-8">Henüz kayıtlı olay yok.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
