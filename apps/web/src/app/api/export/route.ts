import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

/**
 * GDPR-compliant data export
 * Returns all user data in a downloadable JSON format
 */
export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    try {
        // Fetch all user data
        const userData = await prisma.user.findUnique({
            where: { id: user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                personas: {
                    select: {
                        id: true,
                        name: true,
                        identityMemory: true,
                        preferences: true,
                        system1Weight: true,
                        system2Weight: true,
                        decisionThreshold: true,
                        createdAt: true,
                        updatedAt: true,
                        memoryEntries: {
                            select: {
                                id: true,
                                type: true,
                                content: true,
                                importanceScore: true,
                                topic: true,
                                emotion: true,
                                people: true,
                                location: true,
                                createdAt: true
                            }
                        },
                        identitySnapshots: {
                            select: {
                                id: true,
                                version: true,
                                identityState: true,
                                reasonForChange: true,
                                createdAt: true
                            }
                        },
                        consistencyLogs: {
                            select: {
                                id: true,
                                deviationScore: true,
                                detectedIssue: true,
                                context: true,
                                createdAt: true
                            }
                        },
                        conversations: {
                            select: {
                                id: true,
                                startedAt: true,
                                endedAt: true,
                                metadata: true,
                                messages: {
                                    select: {
                                        id: true,
                                        role: true,
                                        content: true,
                                        createdAt: true
                                    }
                                }
                            }
                        }
                    }
                },
                usageLogs: {
                    select: {
                        id: true,
                        logDate: true,
                        requestsCount: true,
                        tokensInput: true,
                        tokensOutput: true
                    }
                },
                auditLogs: {
                    select: {
                        id: true,
                        action: true,
                        resourceType: true,
                        createdAt: true
                    },
                    take: 100 // Limit for performance
                }
            }
        });

        if (!userData) {
            return NextResponse.json(
                { error: 'User data not found' },
                { status: 404 }
            );
        }

        // Create export metadata
        const exportData = {
            exportInfo: {
                exportedAt: new Date().toISOString(),
                format: 'GDPR Data Export',
                version: '1.0',
                userId: user!.id
            },
            userData
        };

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="mnemos-export-${user!.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error) {
        console.error('Data export error:', error);
        return NextResponse.json(
            { error: 'Failed to export data' },
            { status: 500 }
        );
    }
}

/**
 * Delete all user data (Right to be Forgotten)
 */
export async function DELETE(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    try {
        // Delete user and all related data (cascading)
        await prisma.user.delete({
            where: { id: user!.id }
        });

        // Create response and clear cookies
        const response = NextResponse.json({
            message: 'All your data has been permanently deleted'
        });

        response.cookies.delete('auth-token');
        response.cookies.delete('refresh-token');

        return response;

    } catch (error) {
        console.error('Data deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete data' },
            { status: 500 }
        );
    }
}
