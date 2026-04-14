'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Eye,
    X,
    Save,
    AlertTriangle
} from 'lucide-react';

interface TableRecord {
    id: string;
    [key: string]: unknown;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const TABLE_NAMES: Record<string, string> = {
    users: 'Kullanıcılar',
    api_keys: 'API Anahtarları',
    personas: 'Personalar',
    personality_dna: 'Kişilik DNA',
    mental_state_logs: 'Zihinsel Durum Logları',
    value_nodes: 'Değer Düğümleri',
    value_edges: 'Değer Kenarları',
    identity_snapshots: 'Kimlik Anlık Görüntüleri',
    memory_entries: 'Hafıza Kayıtları',
    memory_clusters: 'Hafıza Kümeleri',
    proactive_messages: 'Proaktif Mesajlar',
    conversations: 'Konuşmalar',
    messages: 'Mesajlar',
    decisions: 'Kararlar',
    usage_logs: 'Kullanım Logları',
    audit_logs: 'Denetim Logları',
    consistency_logs: 'Tutarlılık Logları',
    abuse_logs: 'Kötüye Kullanım Logları',
    api_key_events: 'API Anahtar Olayları',
    consent_records: 'Onay Kayıtları',
    user_encryption_keys: 'Şifreleme Anahtarları',
};

export default function TablePage({ params }: { params: Promise<{ table: string }> }) {
    const { table } = use(params);
    const router = useRouter();

    const [records, setRecords] = useState<TableRecord[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [viewRecord, setViewRecord] = useState<TableRecord | null>(null);
    const [editRecord, setEditRecord] = useState<TableRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<TableRecord | null>(null);
    const [editData, setEditData] = useState<string>('');

    const tableName = TABLE_NAMES[table] || table;

    const fetchRecords = async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/${table}?page=${page}&limit=20`);
            const data = await res.json();
            if (data.success) {
                setRecords(data.records);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch records:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [table]);

    const columns = records.length > 0 ? Object.keys(records[0]).slice(0, 6) : [];

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? '✓' : '✗';
        if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '...';
        if (typeof value === 'string' && value.length > 40) return value.slice(0, 40) + '...';
        return String(value);
    };

    const handleDelete = async () => {
        if (!deleteRecord) return;
        try {
            const res = await fetch(`/api/admin/${table}/${deleteRecord.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setDeleteRecord(null);
                fetchRecords(pagination.page);
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleSave = async () => {
        if (!editRecord) return;
        try {
            const parsed = JSON.parse(editData);
            const res = await fetch(`/api/admin/${table}/${editRecord.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            });
            const data = await res.json();
            if (data.success) {
                setEditRecord(null);
                fetchRecords(pagination.page);
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
                <div>
                    <h1 className="text-xl font-bold text-white">{tableName}</h1>
                    <p className="text-sm text-slate-400">{pagination.total} kayıt</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    </div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <p>Kayıt bulunamadı</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-900/50 sticky top-0">
                            <tr>
                                {columns.map((col) => (
                                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        {col}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {records.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col} className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                                            {formatValue(record[col])}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setViewRecord(record)}
                                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                title="Görüntüle"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditRecord(record);
                                                    setEditData(JSON.stringify(record, null, 2));
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteRecord(record)}
                                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800/50 bg-slate-900/30">
                <div className="text-sm text-slate-400">
                    Sayfa {pagination.page} / {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchRecords(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => fetchRecords(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* View Modal */}
            {viewRecord && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                            <h3 className="font-semibold text-white">Kayıt Detayları</h3>
                            <button
                                onClick={() => setViewRecord(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 overflow-auto max-h-[60vh]">
                            <pre className="text-sm text-slate-300 font-mono bg-slate-950 p-4 rounded-lg overflow-auto">
                                {JSON.stringify(viewRecord, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editRecord && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                            <h3 className="font-semibold text-white">Kaydı Düzenle</h3>
                            <button
                                onClick={() => setEditRecord(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <textarea
                                value={editData}
                                onChange={(e) => setEditData(e.target.value)}
                                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 font-mono focus:outline-none focus:border-emerald-500/50 resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
                            <button
                                onClick={() => setEditRecord(null)}
                                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-2"
                            >
                                <Save size={16} />
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteRecord && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md">
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-full bg-red-500/10">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <h3 className="font-semibold text-white">Kaydı Sil</h3>
                            </div>
                            <p className="text-slate-400 text-sm mb-2">
                                Bu kaydı silmek istediğinizden emin misiniz?
                            </p>
                            <p className="text-slate-500 text-xs font-mono bg-slate-950 p-2 rounded">
                                ID: {deleteRecord.id}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800">
                            <button
                                onClick={() => setDeleteRecord(null)}
                                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
