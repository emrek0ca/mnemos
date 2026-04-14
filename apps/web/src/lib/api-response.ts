/**
 * MNEMOS – API Response Helpers
 * Standardized response format for all API endpoints
 */

import { NextResponse } from 'next/server';

// ==================== Types ====================

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        hasMore?: boolean;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== Success Helpers ====================

/**
 * Standard success response
 */
export function successResponse<T>(
    data: T,
    status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data
        },
        { status }
    );
}

/**
 * Paginated success response
 */
export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): NextResponse<ApiSuccessResponse<T[]>> {
    return NextResponse.json({
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            hasMore: page * limit < total
        }
    });
}

/**
 * Created response (201)
 */
export function createdResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
    return successResponse(data, 201);
}

/**
 * No content response (204)
 */
export function noContentResponse(): NextResponse {
    return new NextResponse(null, { status: 204 });
}

// ==================== Error Helpers ====================

/**
 * Standard error response
 */
export function errorResponse(
    code: string,
    message: string,
    status: number = 400,
    details?: unknown
): NextResponse<ApiErrorResponse> {
    const errorObj: ApiErrorResponse['error'] = {
        code,
        message
    };

    if (details !== undefined) {
        errorObj.details = details;
    }

    return NextResponse.json(
        {
            success: false,
            error: errorObj
        },
        { status }
    );
}

/**
 * Bad request error (400)
 */
export function badRequestError(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
    return errorResponse('BAD_REQUEST', message, 400, details);
}

/**
 * Unauthorized error (401)
 */
export function unauthorizedError(message: string = 'Authentication required'): NextResponse<ApiErrorResponse> {
    return errorResponse('UNAUTHORIZED', message, 401);
}

/**
 * Forbidden error (403)
 */
export function forbiddenError(message: string = 'Access denied'): NextResponse<ApiErrorResponse> {
    return errorResponse('FORBIDDEN', message, 403);
}

/**
 * Not found error (404)
 */
export function notFoundError(resource: string = 'Resource'): NextResponse<ApiErrorResponse> {
    return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Conflict error (409)
 */
export function conflictError(message: string): NextResponse<ApiErrorResponse> {
    return errorResponse('CONFLICT', message, 409);
}

/**
 * Rate limit error (429)
 */
export function rateLimitError(retryAfter: number): NextResponse<ApiErrorResponse> {
    const response = errorResponse(
        'RATE_LIMITED',
        'Too many requests. Please try again later.',
        429
    );
    response.headers.set('Retry-After', retryAfter.toString());
    return response;
}

/**
 * Internal server error (500)
 */
export function internalError(message: string = 'An unexpected error occurred'): NextResponse<ApiErrorResponse> {
    return errorResponse('INTERNAL_ERROR', message, 500);
}

// ==================== Utility Functions ====================

/**
 * Wrap async handler with error catching
 */
export function withErrorHandling<T>(
    handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
    return handler().catch((error: Error) => {
        console.error('API Error:', error);
        return internalError(error.message);
    });
}
