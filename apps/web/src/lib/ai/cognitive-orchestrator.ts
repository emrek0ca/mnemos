/**
 * MNEMOS – Cognitive Preservation System
 * Cognitive Orchestrator
 * 
 * Central hub that coordinates all cognitive modules:
 * - Identity Core ↔ Memory Engine ↔ Consistency Layer
 * - Timeline logging
 * - Analytics feedback loop
 * 
 * All modules work together like interlocking gears.
 */

import prisma from '../db';
import { getIdentityCore, reinterpretIdentity } from './identity';
import { fadeWorkingMemories, getAccessibleMemories } from './memory';
import { generateEmbedding, cosineSimilarity } from './memory-recall';
import { loadPastStatements } from './self-consistency';
import { calculateFidelityMetrics, FidelityMetrics } from './fidelity-metrics';
import { PerceptionResult } from './perception';

// ==================== TYPES ====================

export interface CognitiveEvent {
    type: 'identity_change' | 'memory_created' | 'memory_recalled' | 'memory_faded' |
    'consistency_violation' | 'cognitive_shift' | 'learning_applied' | 'cognitive_processing';
    timestamp: Date;
    details: Record<string, unknown>;
    personaId: string;
}

export interface DynamicCognitiveStyle {
    system1Tendency: number;
    riskTolerance: number;
    emotionalIntensity: number;
    uncertaintyTolerance: number;
    // Context modifiers
    contextModifier: number;
    reason: string;
}

export interface ConsistencyEnforcement {
    isAllowed: boolean;
    violations: string[];
    suggestedCorrections: string[];
}

// ==================== COGNITIVE ORCHESTRATOR ====================

class CognitiveOrchestrator {
    private eventQueue: CognitiveEvent[] = [];
    private lastFidelityCheck: Date | null = null;
    private fidelityCache: FidelityMetrics | null = null;

    /**
     * Get dynamic cognitive style based on context
     * This is the "gear" that adapts identity to current situation
     */
    async getDynamicCognitiveStyle(
        personaId: string,
        perception: PerceptionResult
    ): Promise<DynamicCognitiveStyle> {
        const identity = await getIdentityCore();

        if (!identity) {
            return {
                system1Tendency: 0.5,
                riskTolerance: 0.5,
                emotionalIntensity: 0.5,
                uncertaintyTolerance: 0.5,
                contextModifier: 1.0,
                reason: 'No identity found, using defaults'
            };
        }

        const base = identity.cognitiveStyle;
        let modifier = 1.0;
        let reason = 'Normal operation';

        // High urgency → More intuitive (faster System 1)
        if (perception.urgency > 0.7) {
            modifier = 1.0 + (perception.urgency - 0.7) * 0.5;
            reason = 'High urgency detected, increasing intuitive response';
        }

        // High complexity → More analytical (slower System 2)
        if (perception.complexity > 0.7) {
            modifier = 1.0 - (perception.complexity - 0.7) * 0.3;
            reason = 'High complexity detected, switching to analytical mode';
        }

        // Fear → More cautious (lower risk tolerance)
        if (perception.emotion.fear > 0.6) {
            modifier *= 0.8;
            reason = 'Fear detected, reducing risk tolerance';
        }

        // Joy → More exploratory (higher risk tolerance)
        if (perception.emotion.joy > 0.6) {
            modifier *= 1.2;
            reason = 'Positive emotion detected, increasing openness';
        }

        return {
            system1Tendency: Math.min(1, Math.max(0, base.system1Tendency * modifier)),
            riskTolerance: Math.min(1, Math.max(0, base.riskTolerance *
                (perception.emotion.fear > 0.5 ? 0.7 : 1.0) *
                (perception.emotion.joy > 0.5 ? 1.3 : 1.0)
            )),
            emotionalIntensity: Math.min(1, Math.max(0, base.emotionalIntensity *
                (1 + Math.max(perception.emotion.fear, perception.emotion.joy, perception.emotion.sadness) * 0.3)
            )),
            uncertaintyTolerance: base.uncertaintyTolerance,
            contextModifier: modifier,
            reason
        };
    }

    /**
     * Semantic consistency check using embeddings
     * Much more accurate than keyword-based checking
     */
    async checkSemanticConsistency(
        personaId: string,
        proposedResponse: string,
        topic: string
    ): Promise<ConsistencyEnforcement> {
        const violations: string[] = [];
        const suggestedCorrections: string[] = [];

        // Load identity boundaries
        const identity = await getIdentityCore();
        if (!identity) {
            return { isAllowed: true, violations: [], suggestedCorrections: [] };
        }

        // Generate embedding for proposed response
        const responseEmbedding = await generateEmbedding(proposedResponse);

        // Check against moral boundaries
        for (const boundary of identity.moralBoundaries) {
            const boundaryEmbedding = await generateEmbedding(boundary);
            const similarity = cosineSimilarity(responseEmbedding, boundaryEmbedding);

            // If response is too similar to a boundary (meaning it might violate it)
            // This is a simplified check - in production, use more sophisticated logic
            if (similarity > 0.6) {
                // Check if the response is actually violating or just discussing
                const negationPatterns = ['yapmamalı', 'olmamalı', 'kaçın', 'asla', 'should not', 'must not', 'avoid'];
                const hasNegation = negationPatterns.some(p => proposedResponse.toLowerCase().includes(p));

                if (!hasNegation) {
                    violations.push(`Potential conflict with boundary: "${boundary}"`);
                    suggestedCorrections.push(`Consider acknowledging the boundary: "${boundary}" while responding`);
                }
            }
        }

        // Check against past statements for contradictions
        const pastStatements = await loadPastStatements(personaId);
        const relevantPast = pastStatements.filter((s: { topic: string; stance: string; timestamp: Date; context: string }) =>
            s.topic.toLowerCase().includes(topic.toLowerCase()) ||
            topic.toLowerCase().includes(s.topic.toLowerCase())
        ).slice(0, 5);

        for (const past of relevantPast) {
            const pastEmbedding = await generateEmbedding(past.stance);
            const similarity = cosineSimilarity(responseEmbedding, pastEmbedding);

            // Very low similarity on same topic might indicate contradiction
            if (similarity < 0.3) {
                violations.push(`Potential contradiction with past statement on "${past.topic}"`);
                suggestedCorrections.push(`Past stance: "${past.stance.substring(0, 100)}..."`);
            }
        }

        return {
            isAllowed: violations.length === 0,
            violations,
            suggestedCorrections
        };
    }

    /**
     * Log cognitive event to timeline
     */
    async logEvent(event: CognitiveEvent): Promise<void> {
        this.eventQueue.push(event);

        // Persist to database
        await prisma.auditLog.create({
            data: {
                action: event.type,
                resourceType: 'COGNITIVE_EVENT',
                resourceId: event.personaId,
                newValue: JSON.stringify(event.details),
                severity: event.type === 'consistency_violation' ? 'WARNING' : 'INFO'
            }
        });
    }

    /**
     * Apply learning from analytics to identity
     * This is the feedback loop that makes the system adaptive
     */
    async applyAnalyticsLearning(personaId: string): Promise<boolean> {
        // Get fidelity metrics
        const metrics = await calculateFidelityMetrics(personaId);

        // Get current identity
        const identity = await getIdentityCore();
        if (!identity) return false;

        // Build complete cognitiveStyle with potential updates
        const updatedStyle = {
            system1Tendency: identity.cognitiveStyle.system1Tendency,
            riskTolerance: identity.cognitiveStyle.riskTolerance,
            emotionalIntensity: identity.cognitiveStyle.emotionalIntensity,
            uncertaintyTolerance: identity.cognitiveStyle.uncertaintyTolerance
        };

        let needsUpdate = false;
        let reason = '';

        // If consistency is low, increase analytical tendency
        if (metrics.consistency < 0.6) {
            updatedStyle.system1Tendency = Math.max(0.2, identity.cognitiveStyle.system1Tendency - 0.1);
            reason = `Consistency score (${(metrics.consistency * 100).toFixed(0)}%) is low, increasing analytical tendency`;
            needsUpdate = true;
        }

        // If personality alignment is low, adjust emotional intensity
        if (metrics.personalityAlignment < 0.5) {
            updatedStyle.emotionalIntensity = Math.max(0.3, identity.cognitiveStyle.emotionalIntensity - 0.05);
            reason += ` | Personality alignment (${(metrics.personalityAlignment * 100).toFixed(0)}%) needs improvement`;
            needsUpdate = true;
        }

        // If temporal stability is low, increase consistency focus
        if (metrics.temporalStability < 0.6) {
            updatedStyle.uncertaintyTolerance = Math.max(0.3, identity.cognitiveStyle.uncertaintyTolerance - 0.1);
            reason += ` | Improving temporal stability`;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await reinterpretIdentity(
                { cognitiveStyle: updatedStyle },
                `Analytics-driven adaptation: ${reason}`
            );

            await this.logEvent({
                type: 'learning_applied',
                timestamp: new Date(),
                personaId,
                details: {
                    metrics,
                    appliedChanges: updatedStyle,
                    reason
                }
            });

            return true;
        }

        return false;
    }

    /**
     * Memory promotion: Working → Episodic
     * Automatically promotes important working memories
     */
    async promoteImportantMemories(personaId: string): Promise<number> {
        const workingMemories = await getAccessibleMemories('WORKING', 0.3);
        let promoted = 0;

        for (const memory of workingMemories) {
            // Promote if accessed multiple times or high emotional weight
            if (memory.accessCount >= 3 || memory.emotionalWeight > 0.7) {
                await prisma.memoryEntry.update({
                    where: { id: memory.id },
                    data: { type: 'EPISODIC' }
                });

                await this.logEvent({
                    type: 'memory_created',
                    timestamp: new Date(),
                    personaId,
                    details: {
                        action: 'promoted',
                        from: 'WORKING',
                        to: 'EPISODIC',
                        content: memory.content.substring(0, 100),
                        reason: memory.accessCount >= 3 ? 'Frequently accessed' : 'High emotional significance'
                    }
                });

                promoted++;
            }
        }

        return promoted;
    }

    /**
     * Run maintenance tasks
     * Should be called periodically (e.g., every hour)
     */
    async runMaintenance(personaId: string): Promise<{
        fadedMemories: number;
        promotedMemories: number;
        learningApplied: boolean;
    }> {
        // Fade old working memories
        const fadedMemories = await fadeWorkingMemories();

        // Promote important memories
        const promotedMemories = await this.promoteImportantMemories(personaId);

        // Apply learning if needed (not too frequently)
        let learningApplied = false;
        const now = new Date();
        if (!this.lastFidelityCheck ||
            now.getTime() - this.lastFidelityCheck.getTime() > 24 * 60 * 60 * 1000) {
            learningApplied = await this.applyAnalyticsLearning(personaId);
            this.lastFidelityCheck = now;
        }

        return { fadedMemories, promotedMemories, learningApplied };
    }

    /**
     * Get recent cognitive events for timeline
     */
    async getRecentEvents(personaId: string, limit: number = 50): Promise<CognitiveEvent[]> {
        const logs = await prisma.auditLog.findMany({
            where: {
                resourceType: 'COGNITIVE_EVENT',
                resourceId: personaId
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return logs.map(log => ({
            type: log.action as CognitiveEvent['type'],
            timestamp: log.createdAt,
            personaId,
            details: log.newValue ? JSON.parse(log.newValue) : {}
        }));
    }

    /**
     * Get cached or fresh fidelity metrics
     */
    async getFidelityMetrics(personaId: string, forceRefresh = false): Promise<FidelityMetrics> {
        const now = new Date();

        if (!forceRefresh && this.fidelityCache && this.lastFidelityCheck &&
            now.getTime() - this.lastFidelityCheck.getTime() < 5 * 60 * 1000) {
            return this.fidelityCache;
        }

        this.fidelityCache = await calculateFidelityMetrics(personaId);
        this.lastFidelityCheck = now;
        return this.fidelityCache;
    }
}

// Singleton export
export const cognitiveOrchestrator = new CognitiveOrchestrator();
