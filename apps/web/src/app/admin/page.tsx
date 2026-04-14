'use client';

import { useState, useEffect } from 'react';
import { Database, Users, MessageSquare, Brain, Activity, TrendingUp } from 'lucide-react';

interface TableInfo {
    id: string;
    name: string;
    icon: string;
    count: number;
}

interface Stats {
    tables: TableInfo[];
    totalTables: number;
    totalRecords: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/tables');
                const data = await res.json();
                if (data.success) {
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            </div>
        );
    }

    const keyTables = stats?.tables.filter(t =>
        ['users', 'personas', 'conversations', 'memory_entries', 'messages'].includes(t.id)
    ) || [];

    return (
        <div className="h-full overflow-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Veritabanı Dashboard</h1>
                <p className="text-slate-400">
                    Tüm tabloları görüntüle ve yönet
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Database className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-slate-400 text-sm">Toplam Tablo</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats?.totalTables}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-slate-400 text-sm">Toplam Kayıt</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats?.totalRecords?.toLocaleString()}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-slate-400 text-sm">Kullanıcılar</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {stats?.tables.find(t => t.id === 'users')?.count || 0}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Brain className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-slate-400 text-sm">Personalar</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {stats?.tables.find(t => t.id === 'personas')?.count || 0}
                    </div>
                </div>
            </div>

            {/* Table Overview */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800/50">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Tablo Özeti
                    </h2>
                </div>
                <div className="divide-y divide-slate-800/50">
                    {stats?.tables.map((table) => (
                        <a
                            key={table.id}
                            href={`/admin/${table.id}`}
                            className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/30 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{table.icon}</span>
                                <span className="text-slate-300 group-hover:text-white transition-colors">
                                    {table.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500 text-sm">{table.id}</span>
                                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-sm font-medium">
                                    {table.count.toLocaleString()}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
