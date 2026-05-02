/**
 * industryService.ts — Entry point cho Industry services
 */

export { applyCompanyTierMultiplier } from '@/services/ai-ml/companyTiering';
export type { CompanyTier, TieringResult } from '@/services/ai-ml/companyTiering';

export { scoreSkillMatch, SKILL_KEYWORDS, SKILL_CLUSTERS } from '@/services/ai-ml/skillGraph';
export type { SkillMatchResult } from '@/services/ai-ml/skillGraph';

export { detectIndustry } from '@/services/ai-ml/industryDetector';
export { getIndustryBaseline, applyIndustryBaselineEnhancement } from '@/services/ai-ml/embedding-vector/similarity/industryEmbeddingService';
