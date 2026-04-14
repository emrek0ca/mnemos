/**
 * MNEMOS – Cognitive Preservation System
 * AI Module Exports
 */

// Memory System
export {
    createMemory,
    suppressMemory,
    fadeWorkingMemories,
    recallWithTrigger,
    accessMemory,
    getAccessibleMemories,
    buildMemoryContext,
    buildPsychodynamicContext,
    storeInteractionMemory,
    type Memory,
    type MemoryType,
    type MemoryState
} from './memory';

// Identity Core
export {
    getIdentityCore,
    initializeIdentity,
    reinterpretIdentity,
    getIdentityHistory,
    getIdentityAtVersion,
    buildIdentityContext,
    type IdentityCore,
    type IdentityChange
} from './identity';

// Decision Gate (legacy)
export {
    evaluateCognitiveThreshold,
    type PsychologicalFactors,
    type CognitiveDecision
} from './decision-gate';

// Perception Layer
export {
    perceive,
    type PerceptionResult
} from './perception';

// Decision Engine v2
export {
    scoreOption,
    makeDecision,
    contextFromPerception,
    DEFAULT_PROFILE,
    type DecisionProfile,
    type DecisionContext,
    type DecisionOption,
    type DecisionResult
} from './decision-engine-v2';

// Personality Renderer
export {
    generatePersonalityConstraints,
    applyPersonalityFilters,
    determineRenderContext,
    DEFAULT_PERSONALITY,
    type PersonalityProfile,
    type RenderContext
} from './personality-renderer';

// Self-Consistency
export {
    checkConsistency,
    addConsistencyMarkers,
    loadPastStatements,
    loadCoreBeliefs,
    type ConsistencyContext,
    type ConsistencyCheck
} from './self-consistency';

// Learning Loop
export {
    processLearningEvent,
    applyLearning,
    detectLearningOpportunity,
    type LearningEvent,
    type LearningResult
} from './learning-loop';

// Enhanced Memory Recall
export {
    recallMemories,
    storeMemory,
    buildRecallContext,
    generateEmbedding,
    cosineSimilarity,
    recencyScore,
    type MemoryEntry,
    type RecallResult
} from './memory-recall';

// Enhanced Perception
export {
    perceiveEnhanced,
    type EnhancedPerception
} from './perception-enhanced';

// Unified Cognitive Pipeline (Engine Core)
export {
    processCognitivePipeline,
    type CognitiveInput,
    type CognitiveOutput
} from './cognitive-engine';

// Cognitive Orchestrator (New unified coordinator)
export {
    cognitiveOrchestrator,
    type CognitiveEvent,
    type DynamicCognitiveStyle,
    type ConsistencyEnforcement
} from './cognitive-orchestrator';

// Enhanced Identity Functions
export {
    getCognitiveStyleForContext,
    applyDynamicCognitiveShift,
    notifyIdentityChange,
    getIdentityEvolution,
    type ContextualCognitiveStyle
} from './identity';

// Fidelity Metrics
export {
    calculateFidelityMetrics,
    runConsistencyTest,
    detectDeviations,
    getFidelityHistory,
    type FidelityMetrics,
    type ConsistencyTestResult,
    type DeviationEvent
} from './fidelity-metrics';

// ConversationMessage type for chat
export type ConversationMessage = {
    role: 'user' | 'assistant';
    content: string;
};
