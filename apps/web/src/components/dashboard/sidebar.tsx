'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    Brain,
    Key,
    Users,
    BarChart3,
    MessageSquare,
    LogOut,
    ChevronRight,
    ShieldAlert,
    Menu,
    X,
    ArrowLeft,
    Search,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchModal } from './search-modal';

const navigation = [
    { name: 'Kişilik Kurulumu', href: '/dashboard/brain-setup/personality', icon: Sparkles, highlight: true },
    { name: 'Kimlik Çekirdeği', href: '/dashboard/settings/identity', icon: Brain },
    { name: 'Hafıza Yönetimi', href: '/dashboard/settings/memories', icon: Users },
    { name: 'Zaman Çizelgesi', href: '/dashboard/settings/timeline', icon: Key },
    { name: 'Sistem Analitiği', href: '/dashboard/settings/analytics', icon: BarChart3 },
    { name: 'Tutarlılık', href: '/dashboard/settings/consistency', icon: ShieldAlert },
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <>
            {/* Search Modal */}
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Mobile Menu Button - Floating */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 md:hidden bg-white rounded-md shadow-md border border-slate-200"
            >
                {isOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
            </button>

            {/* Sidebar Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="flex h-16 items-center border-b border-slate-100 px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <ArrowLeft className="h-4 w-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-600 group-hover:text-slate-900">Sohbete Dön</span>
                    </Link>
                </div>

                {/* Settings Label */}
                <div className="px-6 pt-6 pb-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Sistem Ayarları
                    </h3>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const isHighlight = 'highlight' in item && item.highlight;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : isHighlight
                                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-100 hover:from-purple-100 hover:to-indigo-100'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5",
                                    isActive ? "text-indigo-600" : isHighlight ? "text-purple-500" : "text-slate-400"
                                )} />
                                {item.name}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                                {isHighlight && !isActive && (
                                    <span className="ml-auto text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full">YENİ</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 p-4 space-y-2">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                        <Search className="h-5 w-5 text-slate-400" />
                        Ara
                    </button>
                    <Link
                        href="/dashboard/personas"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <MessageSquare className="h-5 w-5 text-slate-400" />
                        Personalar
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    >
                        <LogOut className="h-5 w-5 text-slate-400" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>
        </>
    );
}
