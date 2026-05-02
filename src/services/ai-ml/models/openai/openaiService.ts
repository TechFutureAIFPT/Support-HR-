// openaiService.ts — unified re-export from submodules
// Split into: openai-core.ts (core utils), openai-analyze.ts (CV analysis),
//             openai-hard-filters.ts (hard filter extraction), openai-chatbot.ts (chatbot)

export {
  callOpenAI,
  normalizeSchemaForOpenAI,
  extractPromptFromContents,
  isRetryableOpenAIError,
  resetClient,
} from '@/services/ai-ml/models/openai/openai-core';

export { analyzeCVs } from '@/services/ai-ml/models/openai/openai-analyze';
export { extractHardFiltersFromJD } from '@/services/ai-ml/models/openai/openai-hard-filters';
export { getChatbotAdvice } from '@/services/ai-ml/models/openai/openai-chatbot';
