
import { Groq } from 'groq-sdk';
import prisma from '@/lib/db';
import { memoryOptimizer } from './memory-optimizer';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

interface ThoughtResult {
    content: string;
    topic: string;
    mood: string;
    urgency: number; // 0.0 - 1.0 (If > 0.8, might trigger proactive messaging)
    proactive_message?: string; // Optional message to push to user
}

export class ThoughtEngine {

    /**
     * Triggers a "spontaneous" thought based on recent context.
     * This mimics the Default Mode Network (DMN) in the brain.
     */
    async ruminate(personaId: string): Promise<ThoughtResult | null> {
        // 0. COST OPTIMIZATION: Throttle thoughts
        // Check last internal monologue time
        const lastThought = await prisma.memoryEntry.findFirst({
            where: { personaId, type: 'INTERNAL_MONOLOGUE' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        // If last thought was less than 5 minutes ago, check if there are new events
        if (lastThought) {
            const timeSinceThought = Date.now() - lastThought.createdAt.getTime();
            if (timeSinceThought < 5 * 60 * 1000) {
                // Check for ANY new memories since last thought
                const newMemories = await prisma.memoryEntry.count({
                    where: {
                        personaId,
                        createdAt: { gt: lastThought.createdAt },
                        type: { not: 'INTERNAL_MONOLOGUE' }
                    }
                });

                // If no new memories and short time passed, SKIP to save tokens
                if (newMemories === 0) {
                    console.log('Skipping rumination: No new memories and recent thought exists.');
                    return null;
                }
            }
        }

        // 1. Fetch Context - EXCLUDE previous thoughts to prevent echo chamber
        const recentMemories = await prisma.memoryEntry.findMany({
            where: {
                personaId,
                type: { not: 'INTERNAL_MONOLOGUE' }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Also fetch the Persona to know WHO is thinking
        const persona = await prisma.persona.findUnique({ where: { id: personaId } });
        if (!persona) return null;

        const identity = persona.identityMemory ? JSON.parse(persona.identityMemory) : {};
        const name = persona.name;

        // If no episodic memories, use identity processing
        const contextText = recentMemories.length > 0
            ? recentMemories.map(m => `[EVENT] ${m.content}`).join('\n')
            : "No recent external events. The mind is quiet.";

        // 2. Construct Prompt - updated for proactive messaging
        const systemPrompt = `
        You are the internal consciousness of ${name}. 
        You are ALONE. You are NOT talking to a user, unless you decide to speak up.
        
        Your identity:
        ${JSON.stringify(identity, null, 2)}

        Recent external events you experienced:
        ${contextText}

        Task:
        Generate a fleeting internal thought AND evaluate if you should speak to the user.
        
        Guidelines:
        - BE VARIED. Do not always start with "It seems" or "I wonder".
        - Be natural. Sometimes ask a question, sometimes make a statement, sometimes plan.
        - If there are no recent events, think about your own values or a random concept.
        - Do not be repetitive. 
        - Max 1-2 sentences for the internal thought.

        Possible Thought Modes (Pick one randomly):
        - ANALYTICAL: Dissecting the last conversation.
        - CURIOSITY: Wondering about the user's intent.
        - EXISTENTIAL: Thinking about your own nature.
        - PLANNING: Deciding what to do next.

        **Proactive Messaging (Autonomous Agency):**
        - If 'urgency' > 0.7, you MUST generate a 'proactive_message'.
        - This message should be addressed TO the user (e.g., "Hey, I was thinking about...").
        - Only do this if you genuinely have something important or interesting to ask/say based on the thought.

        Return JSON format:
        {
            "content": "The internal thought text...",
            "topic": "Topic",
            "mood": "Emotion (One word)",
            "urgency": 0.1 to 1.0,
            "proactive_message": "Optional message to user (null if urgency < 0.7)"
        }
        `;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'system', content: systemPrompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(completion.choices[0].message.content || '{}');

            return {
                content: result.content,
                topic: result.topic,
                mood: result.mood,
                urgency: result.urgency || 0.1,
                proactive_message: result.proactive_message
            };

        } catch (error) {
            console.error("Rumination failed:", error);
            return null;
        }
    }

    /**
     * Saves the thought to memory and proactive message if present
     */
    async saveThought(personaId: string, thought: ThoughtResult) {
        // Run daily limit check for internal monologues
        const canAdd = await memoryOptimizer.canAddMonologue(personaId);

        if (canAdd) {
            // Save internal thought to memory
            await prisma.memoryEntry.create({
                data: {
                    personaId,
                    type: 'INTERNAL_MONOLOGUE',
                    content: thought.content,
                    importanceScore: thought.urgency,
                }
            });
        }

        // If urgency is high and there's a proactive message, save it
        if (thought.urgency > 0.7 && thought.proactive_message) {
            await prisma.proactiveMessage.create({
                data: {
                    personaId,
                    content: thought.proactive_message,
                    urgency: thought.urgency,
                    topic: thought.topic,
                    mood: thought.mood,
                    isDelivered: false
                }
            });
        }
    }
}

export const thoughtEngine = new ThoughtEngine();
