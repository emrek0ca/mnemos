/**
 * MNEMOS – Rate Limiter
 * IP and endpoint-based rate limiting using in-memory store
 * For production, consider Redis-based solution
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// In-memory store (for single-instance deployment)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration per endpoint category
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    'auth': { maxRequests: 5, windowMs: 60 * 1000 },       // 5 requests per minute (login, register)
    'chat': { maxRequests: 30, windowMs: 60 * 1000 },      // 30 requests per minute
    'api': { maxRequests: 60, windowMs: 60 * 1000 },       // 60 requests per minute (general)
    'thought': { maxRequests: 10, windowMs: 60 * 1000 },   // 10 requests per minute (thought loop)
};

/**
 * Get rate limit key from IP and endpoint
 */
function getRateLimitKey(ip: string, category: string): string {
    return `${ip}:${category}`;
}

/**
 * Extract client IP from request
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    // Fallback for local development
    return '127.0.0.1';
}

/**
 * Check if request is rate limited
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
    ip: string,
    category: keyof typeof RATE_LIMITS = 'api'
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
    const config = RATE_LIMITS[category] || RATE_LIMITS.api;
    const key = getRateLimitKey(ip, category);
    const now = Date.now();

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance per request
        cleanupExpiredEntries();
    }

    const entry = rateLimitStore.get(key);

    if (!entry || now >= entry.resetAt) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + config.windowMs
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt: now + config.windowMs,
            limit: config.maxRequests
        };
    }

    if (entry.count >= config.maxRequests) {
        // Rate limited
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
            limit: config.maxRequests
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetAt: entry.resetAt,
        limit: config.maxRequests
    };
}

/**
 * Rate limit middleware helper for API routes
 */
export function rateLimitResponse(
    request: Request,
    category: keyof typeof RATE_LIMITS = 'api'
): Response | null {
    const ip = getClientIP(request);
    const result = checkRateLimit(ip, category);

    if (!result.allowed) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': result.limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.resetAt.toString(),
                    'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString()
                }
            }
        );
    }

    return null; // Request allowed
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
    response: Response,
    ip: string,
    category: keyof typeof RATE_LIMITS = 'api'
): Response {
    const result = checkRateLimit(ip, category);

    // Clone response to add headers (since Response is immutable)
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetAt.toString());

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

/**
 * Cleanup expired entries from memory
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now >= entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Get rate limit stats (for monitoring)
 */
export function getRateLimitStats(): { totalEntries: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {};

    for (const key of rateLimitStore.keys()) {
        const category = key.split(':')[1];
        categories[category] = (categories[category] || 0) + 1;
    }

    return {
        totalEntries: rateLimitStore.size,
        categories
    };
}
