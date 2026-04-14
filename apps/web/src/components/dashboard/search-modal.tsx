'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Brain, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
    type: 'memory' | 'message';
    id: string;
    content: string;
    relevance: number;
    metadata: {
        personaName?: string;
        memoryType?: string;
        messageRole?: string;
        createdAt: string;
    };
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState<'all' | 'memories' | 'messages'>('all');
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        // Keyboard shortcut: Escape to close
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `/api/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}`
            );
            if (response.ok) {
                const data = await response.json();
                setResults(data.results || []);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, [searchType]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        // Debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    const getResultIcon = (result: SearchResult) => {
        if (result.type === 'memory') {
            return <Brain className="h-4 w-4 text-purple-500" />;
        }
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                    <Search className="h-5 w-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Hafıza ve sohbetlerde ara..."
                        className="flex-1 text-lg outline-none placeholder:text-slate-400"
                    />
                    {loading && <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />}
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50">
                    {(['all', 'memories', 'messages'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setSearchType(type);
                                if (query.length >= 2) performSearch(query);
                            }}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                                searchType === type
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {type === 'all' && 'Tümü'}
                            {type === 'memories' && 'Hafıza'}
                            {type === 'messages' && 'Mesajlar'}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {results.length === 0 && query.length >= 2 && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <FileText className="h-12 w-12 mb-3 opacity-30" />
                            <p className="text-sm">Sonuç bulunamadı</p>
                        </div>
                    )}

                    {results.length === 0 && query.length < 2 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Search className="h-12 w-12 mb-3 opacity-30" />
                            <p className="text-sm">Aramak için en az 2 karakter yazın</p>
                        </div>
                    )}

                    {results.map((result) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            className="flex items-start gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <div className="mt-1">
                                {getResultIcon(result)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-500 uppercase">
                                        {result.type === 'memory' ? result.metadata.memoryType : result.metadata.messageRole}
                                    </span>
                                    {result.metadata.personaName && (
                                        <span className="text-xs text-slate-400">
                                            • {result.metadata.personaName}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400 ml-auto">
                                        {formatDate(result.metadata.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-2">
                                    {result.content}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${result.relevance * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {Math.round(result.relevance * 100)}% eşleşme
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                    <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">ESC</kbd> ile kapat
                </div>
            </div>
        </div>
    );
}
