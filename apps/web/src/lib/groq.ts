// Groq API Client Configuration
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set');
}

export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Model configurations for Dual Process Theory
export const MODELS = {
    // System 1: Fast, intuitive responses
    SYSTEM1: {
        id: 'llama-3.1-8b-instant',
        name: 'LLaMA 3.1 8B (Fast)',
        description: 'Fast intuitive processing for routine queries',
        maxTokens: 4096,
        temperature: 0.7,
    },
    // System 2: Slow, deliberate reasoning
    SYSTEM2: {
        id: 'llama-3.3-70b-versatile',
        name: 'LLaMA 3.3 70B (Reasoning)',
        description: 'Deep analytical processing for complex decisions',
        maxTokens: 8192,
        temperature: 0.3,
    },
} as const;

export type ModelType = keyof typeof MODELS;
