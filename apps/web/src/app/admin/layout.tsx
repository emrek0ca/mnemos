'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Database,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    RefreshCw,
    LogOut,
    Shield
} from 'lucide-react';

interface TableInfo {
    id: string;
    name: string;
    icon: string;
    count: number;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Skip auth check for login page
    const isLoginPage = pathname === '/admin/login';

    const checkAuth = async () => {
        if (isLoginPage) {
            setAuthenticated(true);
            return;
        }

        try {
            const res = await fetch('/api/admin/tables');
            if (res.status === 401 || res.status === 403) {
                setAuthenticated(false);
                router.push('/admin/login');
                return;
            }
            const data = await res.json();
            if (data.success) {
                setAuthenticated(true);
                setTables(data.tables);
            } else {
                setAuthenticated(false);
                router.push('/admin/login');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setAuthenticated(false);
            router.push('/admin/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tables');
            const data = await res.json();
            if (data.success) {
                setTables(data.tables);
            }
        } catch (error) {
            console.error('Failed to fetch tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth/logout', { method: 'POST' });
            router.push('/admin/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [pathname]);

    // Show login page without sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Loading state
    if (authenticated === null) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
            </div>
        );
    }

    // Not authenticated
    if (!authenticated) {
        return null;
    }

    const currentTable = pathname.split('/').pop();

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside
                className={`
          ${collapsed ? 'w-16' : 'w-64'} 
          bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/50
          flex flex-col transition-all duration-300 ease-in-out
        `}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-400" />
                            <span className="font-semibold text-white">Admin Panel</span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    {/* Dashboard Link */}
                    <Link
                        href="/admin"
                        className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 transition-all
              ${pathname === '/admin'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }
            `}
                    >
                        <LayoutDashboard size={18} />
                        {!collapsed && <span className="text-sm font-medium">Dashboard</span>}
                    </Link>

                    {/* Divider */}
                    {!collapsed && (
                        <div className="flex items-center gap-2 px-3 py-2 mt-4 mb-2">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Tablolar
                            </span>
                            <button
                                onClick={fetchTables}
                                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                            >
                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    )}

                    {/* Table Links */}
                    <div className="space-y-1">
                        {tables.map((table) => (
                            <Link
                                key={table.id}
                                href={`/admin/${table.id}`}
                                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
                  ${currentTable === table.id
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }
                `}
                                title={collapsed ? table.name : undefined}
                            >
                                <span className="text-base flex-shrink-0">{table.icon}</span>
                                {!collapsed && (
                                    <>
                                        <span className="text-sm truncate flex-1">{table.name}</span>
                                        <span className={`
                      text-xs px-1.5 py-0.5 rounded-full
                      ${currentTable === table.id
                                                ? 'bg-slate-700 text-slate-300'
                                                : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'
                                            }
                    `}>
                                            {table.count}
                                        </span>
                                    </>
                                )}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800/50 space-y-3">
                    {!collapsed && (
                        <div className="text-xs text-slate-500">
                            Toplam: {tables.reduce((acc, t) => acc + t.count, 0)} kayıt
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`
              flex items-center gap-2 w-full px-3 py-2 rounded-lg
              text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
                        title={collapsed ? 'Çıkış Yap' : undefined}
                    >
                        <LogOut size={16} />
                        {!collapsed && <span className="text-sm">Çıkış Yap</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
