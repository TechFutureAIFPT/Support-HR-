import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, FileText, FolderOpen, Search, UserRoundCheck, Users, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { AnalysisRunData, HistoryEntry } from '@/types';
import type { WorkspaceSessionStatus, WorkspaceSessionViewModel } from '@/types/workspace';
import { WorkspaceEmpty } from '@/components/workspace/WorkspacePrimitives';
import { cvFilterHistoryService } from '@/services/history-cache/analysisHistory';
import { fetchRecentHistory } from '@/services/history-cache/historyService';
import { readLatestAnalysisRun } from '@/services/history-cache/latestAnalysisRun';
import { getWorkspaceSessionStatus, setWorkspaceSessionStatus } from '@/services/workspace/workspaceSessionState';
import { normalizeVietnameseDisplay } from '@/utils/textDisplay';

interface WorkspaceDashboardPageProps {
  userEmail?: string;
  currentRun?: AnalysisRunData | null;
  onOpenSession: (history: HistoryEntry | null, session: WorkspaceSessionViewModel) => void;
}

const statusMeta: Record<WorkspaceSessionStatus, { label: string; className: string }> = {
  open: { label: 'Đang mở', className: 'border-[#1d4e89]/25 bg-[#1d4e89]/[0.08] text-[#1d4e89]' },
  review: { label: 'Đang duyệt', className: 'border-[#f4d6a5] bg-[#fff7e8] text-[#a35d00]' },
  completed: { label: 'Hoàn thành', className: 'border-[#bde8c8] bg-[#eefaf2] text-[#16883f]' },
};

function getFallbackSessionStatus(candidateCount: number): WorkspaceSessionStatus {
  return candidateCount > 0 ? 'review' : 'open';
}

function needsReviewCount(candidates: AnalysisRunData['candidates']): number {
  return candidates.filter((candidate) => {
    if (candidate.status !== 'SUCCESS') return false;
    const status = candidate.stageDecision?.status;
    return !status || status === 'review' || status === 'hold';
  }).length;
}

function historyToSession(entry: HistoryEntry, owner: string): WorkspaceSessionViewModel {
  const candidates = entry.fullPayload?.candidates || [];
  const fallbackStatus = getFallbackSessionStatus(candidates.length);

  return {
    id: entry.id || String(entry.timestamp),
    title: normalizeVietnameseDisplay(entry.jobPosition) || 'Phiên tuyển dụng',
    createdAt: entry.timestamp,
    updatedAt: entry.timestamp,
    candidateCount: entry.totalCandidates || candidates.length,
    needsReview: needsReviewCount(candidates),
    status: getWorkspaceSessionStatus(owner, entry.id || String(entry.timestamp), fallbackStatus),
    candidates,
    history: entry,
  };
}

function currentToSession(run: AnalysisRunData, owner: string): WorkspaceSessionViewModel {
  const id = `local-${run.timestamp}`;

  return {
    id,
    title: normalizeVietnameseDisplay(run.job.position) || 'Phiên tuyển dụng hiện tại',
    createdAt: run.timestamp,
    updatedAt: run.timestamp,
    candidateCount: run.candidates.length,
    needsReview: needsReviewCount(run.candidates),
    status: getWorkspaceSessionStatus(owner, id, getFallbackSessionStatus(run.candidates.length)),
    candidates: run.candidates,
  };
}

function relativeTime(timestamp: number): string {
  const difference = Date.now() - timestamp;
  if (difference < 60_000) return 'Vừa xong';
  if (difference < 3_600_000) return `${Math.max(1, Math.floor(difference / 60_000))} phút trước`;
  if (difference < 86_400_000) return `${Math.floor(difference / 3_600_000)} giờ trước`;
  if (difference < 172_800_000) return 'Hôm qua';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(timestamp);
}

const WorkspaceDashboardPage: React.FC<WorkspaceDashboardPageProps> = ({ userEmail, currentRun, onOpenSession }) => {
  const owner = (userEmail || 'local').toLowerCase();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<WorkspaceSessionViewModel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const buildLocalSessions = useCallback((localRunOverride?: AnalysisRunData | null) => {
    const localRun = localRunOverride !== undefined ? localRunOverride : (currentRun || readLatestAnalysisRun());
    const localHistorySessions = cvFilterHistoryService.getRecentHistory().map((entry) => {
      const id = `local-history-${entry.timestamp}`;
      return {
        id,
        title: normalizeVietnameseDisplay(entry.jobPosition || '') || 'Phiên tuyển dụng',
        createdAt: entry.timestamp,
        updatedAt: entry.timestamp,
        candidateCount: 0,
        needsReview: 0,
        status: getWorkspaceSessionStatus(owner, id, 'open'),
        candidates: [],
      } satisfies WorkspaceSessionViewModel;
    });
    const local = localRun ? currentToSession(localRun, owner) : null;
    return { local, localHistorySessions };
  }, [currentRun, owner]);

  const load = useCallback(async () => {
    const { local, localHistorySessions } = buildLocalSessions();
    const immediate = local ? [local, ...localHistorySessions] : localHistorySessions;

    if (immediate.length > 0) {
      setSessions(immediate);
      const requestedSession = searchParams.get('session');
      const requested = requestedSession
        ? immediate.find((session) => session.id === requestedSession || String(session.createdAt) === requestedSession)
        : null;
      setSelectedId((current) => requested?.id || current || immediate[0]?.id || null);
    } else {
      setLoading(true);
    }

    try {
      const history = await fetchRecentHistory(20, userEmail);
      const mapped = history.map((entry) => historyToSession(entry, owner));
      const merged = [...mapped];

      localHistorySessions.forEach((session) => {
        if (!merged.some((item) => item.createdAt === session.createdAt || item.title === session.title)) {
          merged.push(session);
        }
      });

      const next = local && !merged.some((session) => session.createdAt === local.createdAt)
        ? [local, ...merged]
        : merged;

      setSessions(next);
      const requestedSession = searchParams.get('session');
      const requested = requestedSession
        ? next.find((session) => session.id === requestedSession || String(session.createdAt) === requestedSession)
        : null;
      setSelectedId((current) => requested?.id || (current && next.some((session) => session.id === current) ? current : next[0]?.id || null));
    } catch {
      // Keep local data when remote history cannot be loaded.
    } finally {
      setLoading(false);
    }
  }, [buildLocalSessions, owner, searchParams, userEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('supporthr:workspace-session-state', refresh);
    return () => window.removeEventListener('supporthr:workspace-session-state', refresh);
  }, [load]);

  const visibleSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? sessions.filter((session) => session.title.toLowerCase().includes(normalized)) : sessions;
  }, [query, sessions]);

  const selected = sessions.find((session) => session.id === selectedId) || null;
  const openCount = sessions.filter((session) => session.status === 'open').length;
  const reviewCount = sessions.filter((session) => session.status === 'review').length;
  const completedCount = sessions.filter((session) => session.status === 'completed').length;

  const updateStatus = (status: WorkspaceSessionStatus) => {
    if (!selected) return;
    setWorkspaceSessionStatus(owner, selected.id, status);
  };

  return (
    <div className="flex h-full min-h-0 bg-white text-[#1d1d1f]">
      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
        <div className="supporthr-page-shell">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em]">Tổng quan tuyển dụng</h1>

          <div className="mt-8 grid gap-5 border-b border-[#e5e5ea] pb-8 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <FolderOpen size={23} className="text-[#007aff]" strokeWidth={1.7} />
              <p className="text-[15px]">
                <strong className="mr-2 text-[22px] font-semibold">{openCount}</strong>
                phiên đang mở
              </p>
            </div>
            <div className="flex items-center gap-3">
              <UserRoundCheck size={25} className="text-[#ff9f0a]" strokeWidth={1.7} />
              <p className="text-[15px]">
                <strong className="mr-2 text-[22px] font-semibold">{reviewCount}</strong>
                phiên đang duyệt
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={25} className="text-[#24a148]" strokeWidth={1.7} />
              <p className="text-[15px]">
                <strong className="mr-2 text-[22px] font-semibold">{completedCount}</strong>
                phiên hoàn thành
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-semibold">Danh sách phiên tuyển dụng</h2>
              {loading && sessions.length > 0 && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#86868b]">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Đang đồng bộ...
                </span>
              )}
            </div>
            <label className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm phiên"
                className="h-10 w-full rounded-lg border border-[#d2d2d7] bg-white pl-10 pr-3 text-[13px] outline-none focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
              />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading && sessions.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#86868b]">Đang tải dữ liệu phiên tuyển dụng...</p>
            ) : visibleSessions.length ? (
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#d2d2d7] text-[12px] font-medium text-[#6e6e73]">
                    <th className="px-3 py-3">Vị trí</th>
                    <th className="px-3 py-3">Ứng viên</th>
                    <th className="px-3 py-3">Cần duyệt</th>
                    <th className="px-3 py-3">Cập nhật</th>
                    <th className="px-3 py-3">Trạng thái</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {visibleSessions.map((session) => {
                    const meta = statusMeta[session.status];
                    const active = session.id === selectedId;

                    return (
                      <tr
                        key={session.id}
                        tabIndex={0}
                        onClick={() => setSelectedId(session.id)}
                        onDoubleClick={() => onOpenSession(session.history || null, session)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') onOpenSession(session.history || null, session);
                        }}
                        className={`cursor-pointer border-b border-[#e5e5ea] text-[14px] outline-none transition hover:bg-[#f7f9fc] focus:bg-[#eef5ff] ${active ? 'bg-[#eef5ff] shadow-[inset_3px_0_0_#007aff]' : ''}`}
                      >
                        <td className="px-3 py-4 font-medium">{session.title}</td>
                        <td className="px-3 py-4">{session.candidateCount}</td>
                        <td className="px-3 py-4">{session.needsReview}</td>
                        <td className="px-3 py-4 text-[#515154]">{relativeTime(session.updatedAt)}</td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] font-medium ${meta.className}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {meta.label}
                          </span>
                        </td>
                        <td>
                          <ChevronRight size={16} className="text-[#86868b]" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <WorkspaceEmpty
                title="Chưa có phiên tuyển dụng"
                description="Nạp JD và CV để bắt đầu phiên sàng lọc đầu tiên."
              />
            )}
          </div>
        </div>
      </main>

      {selected ? (
        <aside className="hidden w-[320px] shrink-0 border-l border-[#d2d2d7] bg-[#fbfbfd] xl:flex xl:flex-col">
          <div className="flex h-14 items-center justify-between border-b border-[#d2d2d7] px-5">
            <h2 className="text-[15px] font-semibold">Chi tiết phiên</h2>
            <button type="button" onClick={() => setSelectedId(null)} className="apple-toolbar-icon" aria-label="Đóng inspector">
              <X size={16} />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
            <h3 className="text-[17px] font-semibold">{selected.title}</h3>
            <select
              value={selected.status}
              onChange={(event) => updateStatus(event.target.value as WorkspaceSessionStatus)}
              className={`mt-3 rounded-md border px-2 py-1 text-[12px] font-medium outline-none ${statusMeta[selected.status].className}`}
            >
              <option value="open">Đang mở</option>
              <option value="review">Đang duyệt</option>
              <option value="completed">Hoàn thành</option>
            </select>

            <dl className="mt-6 space-y-5 border-t border-[#e5e5ea] pt-5 text-[13px]">
              <div>
                <dt className="text-[#86868b]">Mã phiên</dt>
                <dd className="mt-1 font-medium">{selected.id}</dd>
              </div>
              <div className="flex items-start gap-3">
                <Users size={17} className="mt-0.5 text-[#6e6e73]" />
                <div>
                  <dt className="text-[#86868b]">Ứng viên</dt>
                  <dd className="mt-1 font-medium">{selected.candidateCount}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={17} className="mt-0.5 text-[#6e6e73]" />
                <div>
                  <dt className="text-[#86868b]">Cần duyệt</dt>
                  <dd className="mt-1 font-medium">{selected.needsReview}</dd>
                </div>
              </div>
              <div>
                <dt className="text-[#86868b]">Cập nhật cuối</dt>
                <dd className="mt-1 font-medium">{relativeTime(selected.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-[#d2d2d7] p-4">
            <button
              type="button"
              onClick={() => onOpenSession(selected.history || null, selected)}
              className="h-10 w-full rounded-lg border border-[#007aff] bg-white text-[13px] font-medium text-[#0066d6] hover:bg-[#eef5ff]"
            >
              Xem chi tiết phiên
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
};

export default WorkspaceDashboardPage;
