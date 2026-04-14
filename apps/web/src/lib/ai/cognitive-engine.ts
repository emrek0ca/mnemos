/**
 * MNEMOS – Cognitive Preservation System
 * Unified Cognitive Pipeline
 * (Legacy Wrapper for src/lib/ai/engine/core.ts)
 */

import { cognitiveEngine, CognitiveInput, CognitiveOutput } from './engine/core';

// Export types
export type { CognitiveInput, CognitiveOutput };
export type { CognitiveOutput as CognitiveResponse, CognitiveInput as CognitiveRequest };

/**
 * Main cognitive processing function - runs the full pipeline
 * Accesses the new robust CognitiveEngine class.
 */
export async function processCognitivePipeline(
    input: CognitiveInput
): Promise<CognitiveOutput> {
    return await cognitiveEngine.process(input);
}

// Export for backwards compatibility
export async function processCognitiveRequest(input: CognitiveInput): Promise<CognitiveOutput> {
    return processCognitivePipeline(input);
}
