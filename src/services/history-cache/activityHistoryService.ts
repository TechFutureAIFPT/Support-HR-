import { auth } from '@/services/firebase';
import { fetchManualHistory, fetchRecentHistory } from '@/services/history-cache/historyService';
import { cvFilterHistoryService } from '@/services/history-cache/analysisHistory';
import type { HistoryEntry } from '@/types';

export interface ActivityHistoryEntry {
  id: string;
  timestamp: number;
  jobPosition: string;
  industry: string;
  locationRequirement: string;
  jdTextSnippet: string;
  totalCandidates: number;
  source: 'render' | 'local';
  fullPayload?: HistoryEntry['fullPayload'];
}

export interface ActivityHistoryStats {
  totalSessions: number;
  lastSession: string | null;
  thisWeekCount: number;
  thisMonthCount: number;
}

export interface RecentUsedJDTemplate {
  id: string;
  name: string;
  category: string;
  jobPosition: string;
  jdText: string;
  hardFilters: Record<string, unknown>;
  timestamp: number;
}

export interface ActivityHistoryResult {
  entries: ActivityHistoryEntry[];
  source: 'render' | 'local' | 'none';
}

function formatSessionDate(timestamp: number): string | null {
  if (!timestamp || Number.isNaN(timestamp)) return null;

  return new Date(timestamp).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deriveIndustry(entry: HistoryEntry): string {
  const hardFilters = entry.fullPayload?.hardFilters;
  const hardFilterIndustry =
    hardFilters && typeof hardFilters === 'object' && typeof hardFilters.industry === 'string'
      ? hardFilters.industry.trim()
      : '';

  if (hardFilterIndustry) return hardFilterIndustry;

  const candidateIndustry = entry.fullPayload?.candidates?.find((candidate) => candidate.industry)?.industry;
  return candidateIndustry?.trim() || 'Khác';
}

function normalizeBackendEntry(entry: HistoryEntry): ActivityHistoryEntry {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    jobPosition: entry.jobPosition || entry.fullPayload?.jobPosition || 'Không rõ vị trí',
    industry: deriveIndustry(entry),
    locationRequirement: entry.locationRequirement || '',
    jdTextSnippet: entry.jdTextSnippet || entry.fullPayload?.jdText?.slice(0, 220) || '',
    totalCandidates: entry.totalCandidates || entry.fullPayload?.candidates?.length || 0,
    source: 'render',
    fullPayload: entry.fullPayload,
  };
}

function normalizeLocalEntry(
  entry: ReturnType<typeof cvFilterHistoryService.getHistory>[number]
): ActivityHistoryEntry {
  return {
    id: `local-${entry.timestamp}`,
    timestamp: entry.timestamp,
    jobPosition: entry.jobPosition || 'Không rõ vị trí',
    industry: entry.industry || 'Khác',
    locationRequirement: '',
    jdTextSnippet: '',
    totalCandidates: 0,
    source: 'local',
  };
}

function sortEntries(entries: ActivityHistoryEntry[]): ActivityHistoryEntry[] {
  return [...entries].sort((left, right) => right.timestamp - left.timestamp);
}

export function buildActivityHistoryStats(entries: ActivityHistoryEntry[]): ActivityHistoryStats {
  if (entries.length === 0) {
    return {
      totalSessions: 0,
      lastSession: null,
      thisWeekCount: 0,
      thisMonthCount: 0,
    };
  }

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  return {
    totalSessions: entries.length,
    lastSession: formatSessionDate(entries[0]?.timestamp),
    thisWeekCount: entries.filter((entry) => entry.timestamp >= oneWeekAgo).length,
    thisMonthCount: entries.filter((entry) => entry.timestamp >= oneMonthAgo).length,
  };
}

export async function getActivityHistory(limitCount = 50): Promise<ActivityHistoryResult> {
  const localEntries = sortEntries(cvFilterHistoryService.getHistory().map(normalizeLocalEntry));

  if (!auth.currentUser) {
    return {
      entries: localEntries,
      source: localEntries.length > 0 ? 'local' : 'none',
    };
  }

  try {
    const userEmail = auth.currentUser.email || undefined;
    const [recentEntries, manualEntries] = await Promise.all([
      fetchRecentHistory(limitCount, userEmail),
      fetchManualHistory(userEmail),
    ]);

    const backendEntries = sortEntries([
      ...manualEntries.map((entry) => ({ ...entry, id: `manual-${entry.id}` })),
      ...recentEntries,
    ].map(normalizeBackendEntry));

    if (backendEntries.length > 0) {
      return { entries: backendEntries, source: 'render' };
    }
  } catch (error) {
    console.warn('Failed to load Render activity history, falling back to local history.', error);
  }

  return {
    entries: localEntries,
    source: localEntries.length > 0 ? 'local' : 'none',
  };
}

export function extractRecentUsedJDTemplates(entries: ActivityHistoryEntry[]): RecentUsedJDTemplate[] {
  const deduped = new Map<string, RecentUsedJDTemplate>();

  for (const entry of entries) {
    const jdText = entry.fullPayload?.jdText?.trim();
    if (!jdText) continue;

    const jobPosition = (entry.fullPayload?.jobPosition || entry.jobPosition || 'JD đã dùng').trim();
    const hardFilters =
      entry.fullPayload?.hardFilters && typeof entry.fullPayload.hardFilters === 'object'
        ? entry.fullPayload.hardFilters as Record<string, unknown>
        : {};

    const category =
      typeof hardFilters.industry === 'string' && hardFilters.industry.trim()
        ? hardFilters.industry.trim()
        : entry.industry || 'Đã dùng gần đây';

    const dedupeKey = `${jobPosition.toLowerCase()}::${jdText.toLowerCase()}`;
    if (deduped.has(dedupeKey)) continue;

    deduped.set(dedupeKey, {
      id: `history-template-${entry.id}`,
      name: jobPosition,
      category,
      jobPosition,
      jdText,
      hardFilters,
      timestamp: entry.timestamp,
    });
  }

  return [...deduped.values()].sort((left, right) => right.timestamp - left.timestamp);
}
