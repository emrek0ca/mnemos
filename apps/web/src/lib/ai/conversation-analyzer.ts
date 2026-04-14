/**
 * MNEMOS – Cognitive Preservation System
 * Conversation Analyzer
 * 
 * Extracts insights from conversations:
 * - Dominant topics
 * - Emotional patterns
 * - Decision types
 * - Memory-worthy moments
 */

import prisma from '../db';
import { perceive } from './perception';

export interface ConversationInsights {
    conversationId: string;
    messageCount: number;
    userMessageCount: number;
    assistantMessageCount: number;

    // Topic analysis
    topics: { topic: string; count: number }[];
    dominantTopic: string;

    // Emotional analysis
    emotionalProfile: {
        avgFear: number;
        avgJoy: number;
        avgSadness: number;
        avgConfidence: number;
        dominantEmotion: string;
    };

    // Cognitive analysis
    cognitiveProfile: {
        avgComplexity: number;
        avgUrgency: number;
        intuitiveResponses: number;
        analyticalResponses: number;
    };

    // Memory candidates
    memoryCandidates: {
        content: string;
        reason: string;
        importance: number;
    }[];

    // Time analysis
    duration?: number;
    startedAt: Date;
    endedAt?: Date;
}

/**
 * Analyze a conversation
 */
export async function analyzeConversation(conversationId: string): Promise<ConversationInsights | null> {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!conversation?.messages.length) {
        return null;
    }

    const messages = conversation.messages;
    const userMessages = messages.filter(m => m.role === 'USER');
    const assistantMessages = messages.filter(m => m.role === 'ASSISTANT');

    // Analyze each user message
    const analyses: ReturnType<typeof perceive>[] = [];
    const topicCounts: Record<string, number> = {};
    let totalFear = 0, totalJoy = 0, totalSadness = 0, totalConfidence = 0;
    let totalComplexity = 0, totalUrgency = 0;

    for (const msg of userMessages) {
        const analysis = perceive(msg.content);
        analyses.push(analysis);

        topicCounts[analysis.topic] = (topicCounts[analysis.topic] || 0) + 1;
        totalFear += analysis.emotion.fear;
        totalJoy += analysis.emotion.joy;
        totalSadness += analysis.emotion.sadness;
        totalConfidence += analysis.emotion.confidence;
        totalComplexity += analysis.complexity;
        totalUrgency += analysis.urgency;
    }

    const msgCount = userMessages.length || 1;

    // Find dominant topic
    const topics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count);

    // Find dominant emotion
    const emotions = {
        fear: totalFear / msgCount,
        joy: totalJoy / msgCount,
        sadness: totalSadness / msgCount,
        confidence: totalConfidence / msgCount
    };
    const dominantEmotion = Object.entries(emotions)
        .sort(([, a], [, b]) => b - a)[0][0];

    // Count cognitive modes from assistant responses
    let intuitiveCount = 0, analyticalCount = 0;
    for (const msg of assistantMessages) {
        if (msg.processingType === 'SYSTEM1') intuitiveCount++;
        else if (msg.processingType === 'SYSTEM2') analyticalCount++;
    }

    // Find memory candidates
    const memoryCandidates = findMemoryCandidates(messages);

    // Calculate duration
    const startedAt = messages[0].createdAt;
    const endedAt = messages[messages.length - 1].createdAt;
    const duration = endedAt.getTime() - startedAt.getTime();

    return {
        conversationId,
        messageCount: messages.length,
        userMessageCount: userMessages.length,
        assistantMessageCount: assistantMessages.length,
        topics,
        dominantTopic: topics[0]?.topic || 'general',
        emotionalProfile: {
            avgFear: emotions.fear,
            avgJoy: emotions.joy,
            avgSadness: emotions.sadness,
            avgConfidence: emotions.confidence,
            dominantEmotion
        },
        cognitiveProfile: {
            avgComplexity: totalComplexity / msgCount,
            avgUrgency: totalUrgency / msgCount,
            intuitiveResponses: intuitiveCount,
            analyticalResponses: analyticalCount
        },
        memoryCandidates,
        duration,
        startedAt,
        endedAt
    };
}

/**
 * Find memory-worthy content in messages
 */
function findMemoryCandidates(
    messages: { role: string; content: string }[]
): ConversationInsights['memoryCandidates'] {
    const candidates: ConversationInsights['memoryCandidates'] = [];

    // Patterns that indicate memory-worthy content
    const patterns = [
        { regex: /benim için önemli|önemli olan/i, reason: 'User stated importance', importance: 0.9 },
        { regex: /her zaman|asla|kesinlikle/i, reason: 'Strong belief statement', importance: 0.85 },
        { regex: /karar verdim|kararım/i, reason: 'Decision made', importance: 0.8 },
        { regex: /değerim|inancım|prensibim/i, reason: 'Value or belief expressed', importance: 0.9 },
        { regex: /hatırlayacağım|unutmayacağım/i, reason: 'User wants to remember', importance: 0.95 },
        { regex: /hayatımda|yaşamımda|geçmişte/i, reason: 'Life story reference', importance: 0.75 },
        { regex: /i decided|my decision|i believe|i always/i, reason: 'Decision or belief (EN)', importance: 0.8 },
        { regex: /important to me|i value|my principle/i, reason: 'Value statement (EN)', importance: 0.85 }
    ];

    for (const msg of messages) {
        if (msg.role !== 'USER') continue;

        for (const pattern of patterns) {
            if (pattern.regex.test(msg.content)) {
                candidates.push({
                    content: msg.content.substring(0, 500),
                    reason: pattern.reason,
                    importance: pattern.importance
                });
                break; // Only one candidate per message
            }
        }
    }

    // Limit to top 5 by importance
    return candidates
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 5);
}

/**
 * Auto-create memories from conversation
 */
export async function createMemoriesFromConversation(
    conversationId: string,
    personaId: string
): Promise<number> {
    const insights = await analyzeConversation(conversationId);
    if (!insights) return 0;

    let created = 0;

    for (const candidate of insights.memoryCandidates) {
        if (candidate.importance >= 0.7) {
            await prisma.memoryEntry.create({
                data: {
                    personaId,
                    content: candidate.content,
                    type: 'EPISODIC',
                    importanceScore: candidate.importance
                }
            });
            created++;
        }
    }

    return created;
}

/**
 * Get aggregate insights for all conversations
 */
export async function getAggregateInsights(personaId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    topTopics: { topic: string; count: number }[];
    emotionalTrend: { emotion: string; avgScore: number }[];
    cognitiveBalance: { intuitive: number; analytical: number };
}> {
    const conversations = await prisma.conversation.findMany({
        where: { personaId },
        include: {
            messages: true
        }
    });

    const allInsights: ConversationInsights[] = [];

    for (const conv of conversations) {
        if (conv.messages.length > 0) {
            const insight = await analyzeConversation(conv.id);
            if (insight) allInsights.push(insight);
        }
    }

    // Aggregate topics
    const topicCounts: Record<string, number> = {};
    for (const insight of allInsights) {
        topicCounts[insight.dominantTopic] = (topicCounts[insight.dominantTopic] || 0) + 1;
    }
    const topTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Aggregate emotions
    const emotionSums = { fear: 0, joy: 0, sadness: 0, confidence: 0 };
    for (const insight of allInsights) {
        emotionSums.fear += insight.emotionalProfile.avgFear;
        emotionSums.joy += insight.emotionalProfile.avgJoy;
        emotionSums.sadness += insight.emotionalProfile.avgSadness;
        emotionSums.confidence += insight.emotionalProfile.avgConfidence;
    }
    const count = allInsights.length || 1;
    const emotionalTrend = Object.entries(emotionSums)
        .map(([emotion, sum]) => ({ emotion, avgScore: sum / count }));

    // Aggregate cognitive modes
    let totalIntuitive = 0, totalAnalytical = 0;
    for (const insight of allInsights) {
        totalIntuitive += insight.cognitiveProfile.intuitiveResponses;
        totalAnalytical += insight.cognitiveProfile.analyticalResponses;
    }

    return {
        totalConversations: conversations.length,
        totalMessages: conversations.reduce((acc, c) => acc + c.messages.length, 0),
        topTopics,
        emotionalTrend,
        cognitiveBalance: { intuitive: totalIntuitive, analytical: totalAnalytical }
    };
}
