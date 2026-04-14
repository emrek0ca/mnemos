import prisma from '@/lib/db';

interface ConsistencyLogData {
    personaId: string;
    messageId?: string;
    deviationScore: number;
    detectedIssue: string;
    context: {
        pastStatement?: string;
        currentStatement: string;
        topic?: string;
    };
}

/**
 * Saves a consistency deviation log to the database.
 */
export async function logConsistencyDeviation(data: ConsistencyLogData) {
    try {
        await prisma.consistencyLog.create({
            data: {
                personaId: data.personaId,
                messageId: data.messageId,
                deviationScore: data.deviationScore,
                detectedIssue: data.detectedIssue,
                context: JSON.stringify(data.context),
            },
        });
        console.log(`Consistency deviation logged for persona ${data.personaId}`);
    } catch (error) {
        console.error('Failed to log consistency deviation:', error);
    }
}
