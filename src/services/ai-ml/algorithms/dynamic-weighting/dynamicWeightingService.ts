/**
 * dynamicWeightingService.ts — Entry point cho Dynamic Weighting
 */

export { applyDynamicBoost, calculateBoost, detectBoostLevel } from '@/services/ai-ml/algorithms/dynamic-weighting/dynamicBoost';
export type { BoostSignal, DynamicBoostConfig } from '@/services/ai-ml/algorithms/dynamic-weighting/dynamicBoost';

export { analyzeCareerVelocity, parseExperienceToMilestones } from '@/services/ai-ml/algorithms/dynamic-weighting/careerVelocity';
export type { CareerMilestone, CareerVelocityResult } from '@/services/ai-ml/algorithms/dynamic-weighting/careerVelocity';

export { adjustWeightsByContext } from '@/services/ai-ml/algorithms/dynamic-weighting/weightingEngine';
export type { WeightedContext, ContextualCriteria } from '@/services/ai-ml/algorithms/dynamic-weighting/weightingEngine';
