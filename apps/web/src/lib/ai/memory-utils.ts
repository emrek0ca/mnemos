/**
 * MNEMOS – Memory Utilities
 * Shared helper functions for memory modules
 */

import prisma from '../db';

/**
 * Get the active persona ID
 * Returns the first persona or throws if none exists
 */
export async function getActivePersonaId(): Promise<string> {
    const persona = await prisma.persona.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        throw new Error('No persona found');
    }

    return persona.id;
}

/**
 * Get persona by ID with validation
 */
export async function getPersonaById(personaId: string): Promise<{
    id: string;
    name: string;
    userId: string;
} | null> {
    return prisma.persona.findUnique({
        where: { id: personaId },
        select: {
            id: true,
            name: true,
            userId: true
        }
    });
}

/**
 * Validate that a persona exists and belongs to user
 */
export async function validatePersonaOwnership(
    personaId: string,
    userId: string
): Promise<boolean> {
    const persona = await prisma.persona.findFirst({
        where: {
            id: personaId,
            userId: userId
        }
    });

    return persona !== null;
}
