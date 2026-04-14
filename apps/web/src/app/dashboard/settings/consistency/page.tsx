'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
    ShieldAlert,
    History,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    ArrowRight
} from 'lucide-react';

interface ConsistencyLog {
    id: string;
    deviationScore: number;
    detectedIssue: string;
    context: {
        pastStatement?: string;
        currentStatement: string;
        topic?: string;
    };
    messageContent: string | null;
    createdAt: string;
}

export default function ConsistencyPage() {
    const [logs, setLogs] = useState<ConsistencyLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        try {
            const response = await fetch('/api/consistency');
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tutarlılık Günlüğü</h1>
                    <p className="text-slate-600 mt-1">
                        Bilişsel sapmaların ve çelişkilerin kaydı
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <RefreshCw className="h-5 w-5 text-slate-500" />
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Tutarlılık Skoru</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {Math.max(0, 100 - (logs.length * 5))}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 rounded-lg">
                                <ShieldAlert className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Toplam Sapma</p>
                                <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {logs.length === 0 ? (
                <Card className="bg-slate-50 border-dashed">
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Her şey yolunda</h3>
                        <p className="text-slate-500">
                            Henüz herhangi bir tutarlılık sapması tespit edilmedi.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <History className="h-5 w-5 text-slate-500" />
                        Son Tespitler
                    </h2>
                    {logs.map((log) => (
                        <Card key={log.id} className="overflow-hidden border-l-4 border-l-amber-500">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            {log.detectedIssue}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {formatDate(log.createdAt)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            Konu: {log.context.topic || 'Genel'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Önceki Söylem
                                        </p>
                                        <p className="text-sm text-slate-600 italic">
                                            "{log.context.pastStatement}"
                                        </p>
                                    </div>

                                    <div className="hidden md:flex items-center justify-center">
                                        <ArrowRight className="h-5 w-5 text-slate-300" />
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Şimdiki Söylem
                                        </p>
                                        <p className="text-sm text-slate-900 font-medium">
                                            "{log.context.currentStatement}"
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
