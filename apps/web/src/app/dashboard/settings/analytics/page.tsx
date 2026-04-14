'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
    Brain,
    MessageSquare,
    TrendingUp,
    Activity,
    Zap,
    Eye,
    Heart,
    Target
} from 'lucide-react';

interface AggregateInsights {
    totalConversations: number;
    totalMessages: number;
    topTopics: { topic: string; count: number }[];
    emotionalTrend: { emotion: string; avgScore: number }[];
    cognitiveBalance: { intuitive: number; analytical: number };
}

export default function AnalyticsPage() {
    const [insights, setInsights] = useState<AggregateInsights | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    async function fetchInsights() {
        try {
            const response = await fetch('/api/analytics');
            if (response.ok) {
                const data = await response.json();
                setInsights(data.insights);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    function getEmotionLabel(emotion: string): string {
        const labels: Record<string, string> = {
            fear: 'Korku',
            joy: 'Sevinç',
            sadness: 'Üzüntü',
            confidence: 'Güven'
        };
        return labels[emotion] || emotion;
    }

    function getEmotionColor(emotion: string): string {
        const colors: Record<string, string> = {
            fear: 'bg-amber-500',
            joy: 'bg-emerald-500',
            sadness: 'bg-blue-500',
            confidence: 'bg-indigo-500'
        };
        return colors[emotion] || 'bg-slate-500';
    }

    function getTopicLabel(topic: string): string {
        const labels: Record<string, string> = {
            money: 'Para',
            career: 'Kariyer',
            relationships: 'İlişkiler',
            health: 'Sağlık',
            education: 'Eğitim',
            personal: 'Kişisel',
            technology: 'Teknoloji',
            philosophy: 'Felsefe',
            general: 'Genel'
        };
        return labels[topic] || topic;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    const cogTotal = (insights?.cognitiveBalance.intuitive || 0) + (insights?.cognitiveBalance.analytical || 0) || 1;
    const intuitivePercent = Math.round(((insights?.cognitiveBalance.intuitive || 0) / cogTotal) * 100);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Analitik</h1>
                <p className="text-slate-600 mt-1">
                    Sohbet ve düşünce kalıplarınızın analizi
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Toplam Sohbet</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {insights?.totalConversations || 0}
                                </p>
                            </div>
                            <MessageSquare className="h-8 w-8 text-indigo-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Toplam Mesaj</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {insights?.totalMessages || 0}
                                </p>
                            </div>
                            <Activity className="h-8 w-8 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Sezgisel Mod</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {insights?.cognitiveBalance.intuitive || 0}
                                </p>
                            </div>
                            <Zap className="h-8 w-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Analitik Mod</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {insights?.cognitiveBalance.analytical || 0}
                                </p>
                            </div>
                            <Eye className="h-8 w-8 text-violet-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cognitive Balance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-500" />
                        Bilişsel Denge
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="flex items-center gap-1">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        Sezgisel
                                    </span>
                                    <span className="flex items-center gap-1">
                                        Analitik
                                        <Eye className="h-4 w-4 text-violet-500" />
                                    </span>
                                </div>
                                <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                                        style={{ width: `${intuitivePercent}%` }}
                                    />
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-400 to-violet-500"
                                        style={{ width: `${100 - intuitivePercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>{intuitivePercent}%</span>
                                    <span>{100 - intuitivePercent}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Top Topics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-emerald-500" />
                            En Çok Konuşulan Konular
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {insights?.topTopics && insights.topTopics.length > 0 ? (
                            <div className="space-y-3">
                                {insights.topTopics.map((topic, i) => {
                                    const maxCount = insights.topTopics[0]?.count || 1;
                                    const width = (topic.count / maxCount) * 100;
                                    return (
                                        <div key={topic.topic}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium">{getTopicLabel(topic.topic)}</span>
                                                <span className="text-slate-500">{topic.count}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">Henüz yeterli veri yok</p>
                        )}
                    </CardContent>
                </Card>

                {/* Emotional Profile */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-rose-500" />
                            Duygusal Profil
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {insights?.emotionalTrend && insights.emotionalTrend.length > 0 ? (
                            <div className="space-y-3">
                                {insights.emotionalTrend.map((emotion) => (
                                    <div key={emotion.emotion}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{getEmotionLabel(emotion.emotion)}</span>
                                            <span className="text-slate-500">{Math.round(emotion.avgScore * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getEmotionColor(emotion.emotion)}`}
                                                style={{ width: `${emotion.avgScore * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-4">Henüz yeterli veri yok</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Insights Summary */}
            <Card className="bg-gradient-to-br from-indigo-50 to-violet-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                            <TrendingUp className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900">Özet</h3>
                            <p className="text-slate-600 mt-1">
                                {insights?.totalConversations ? (
                                    <>
                                        {insights.totalConversations} sohbette toplam {insights.totalMessages} mesaj.
                                        En çok konuştuğunuz konu: <strong>{getTopicLabel(insights.topTopics[0]?.topic || 'general')}</strong>.
                                        Bilişsel tercihiniz {intuitivePercent > 50 ? 'sezgisel' : 'analitik'} yöne eğilimli.
                                    </>
                                ) : (
                                    'Henüz analiz için yeterli sohbet yok. Konuşmaya başladıkça burada içgörüler görüntülenecek.'
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
