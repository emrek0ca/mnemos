import prisma from '../src/lib/db';
import { cognitiveEngine } from '../src/lib/ai/engine/core';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Testing Cognitive Engine...');
    try {
        const result = await cognitiveEngine.process({
            message: 'Hello, who are you?',
            personaId: 'test-persona-id', // Assuming this ID exists or isn't strictly checked in isolation
            conversationHistory: []
        });
        console.log('Success!', result);
    } catch (error) {
        console.error('Cognitive Engine Failed:', error);
    }
}

main();
