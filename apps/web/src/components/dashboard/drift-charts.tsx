'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { TrendingUp, Activity } from 'lucide-react';

interface DriftData {
    version: number;
    timestamp: string;
    cognitive: {
        system1Tendency: number;
        riskTolerance: number;
        emotionalIntensity: number;
        uncertaintyTolerance: number;
    };
    personality: {
        formality: number;
        directness: number;
        warmth: number;
        humor: number;
        confidence: number;
    };
    reason?: string;
}

export default function DriftCharts() {
    const [data, setData] = useState<DriftData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/timeline/drift');
                if (res.ok) {
                    const json = await res.json();
                    setData(json.snapshots || []);
                }
            } catch (error) {
                console.error('Failed to fetch drift data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Yükleniyor...</div>;
    if (data.length < 2) return <div className="h-64 flex items-center justify-center text-slate-400 px-4 text-center">Yeterli veri yok. Grafiklerin oluşması için birkaç rüya döngüsü (Neuroplasticity) tamamlamalısın.</div>;

    // Transform data for charts
    const cognitiveData = data.map(d => ({
        version: `v${d.version}`,
        system1: d.cognitive.system1Tendency,
        risk: d.cognitive.riskTolerance,
        emotion: d.cognitive.emotionalIntensity,
        uncertainty: d.cognitive.uncertaintyTolerance
    }));

    const personalityData = data.map(d => ({
        version: `v${d.version}`,
        formality: d.personality.formality,
        humor: d.personality.humor,
        warmth: d.personality.warmth,
        directness: d.personality.directness
    }));

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        Bilişsel Sürüklenme (Cognitive Drift)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cognitiveData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="version" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 1]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="system1" name="Sezgisellik" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="risk" name="Risk Toleransı" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="emotion" name="Duygusal Yoğunluk" stroke="#F43F5E" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5 text-violet-500" />
                        Kişilik Sürüklenmesi (Personality Drift)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={personalityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="version" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 1]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="humor" name="Mizah" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="formality" name="Resmiyet" stroke="#64748B" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="warmth" name="Sıcaklık" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
