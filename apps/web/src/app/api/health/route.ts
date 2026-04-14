import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getRateLimitStats } from '@/lib/rate-limiter';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
        database: { status: string; latency?: number };
        memory: { used: number; total: number; percentage: number };
        rateLimit: { totalEntries: number };
    };
}

const startTime = Date.now();

export async function GET() {
    const checks: HealthStatus['checks'] = {
        database: { status: 'unknown' },
        memory: { used: 0, total: 0, percentage: 0 },
        rateLimit: { totalEntries: 0 }
    };

    let overallStatus: HealthStatus['status'] = 'healthy';

    // Database check
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        checks.database = {
            status: 'connected',
            latency: Date.now() - start
        };
    } catch (error) {
        checks.database = { status: 'disconnected' };
        overallStatus = 'unhealthy';
        console.error('Health check - DB error:', error);
    }

    // Memory check
    if (typeof process !== 'undefined' && process.memoryUsage) {
        const mem = process.memoryUsage();
        const totalMem = 512 * 1024 * 1024; // Assume 512MB limit
        const percentage = Math.round((mem.heapUsed / totalMem) * 100);
        checks.memory = {
            used: Math.round(mem.heapUsed / 1024 / 1024),
            total: Math.round(totalMem / 1024 / 1024),
            percentage
        };
        if (percentage > 90) {
            overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
        }
    }

    // Rate limit stats
    const rateLimitStats = getRateLimitStats();
    checks.rateLimit = { totalEntries: rateLimitStats.totalEntries };

    const response: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.round((Date.now() - startTime) / 1000),
        version: process.env.npm_package_version || '0.1.0',
        checks
    };

    return NextResponse.json(response, {
        status: overallStatus === 'unhealthy' ? 503 : 200,
        headers: {
            'Cache-Control': 'no-store'
        }
    });
}
