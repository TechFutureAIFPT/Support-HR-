import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { AnalysisFeedbackRecord, Candidate } from '@/types';
import type { WorkspaceSessionStatus } from '@/types/workspace';
import CandidateEmailNotifier from '@/features/email/CandidateEmailNotifier';
import { getActiveAnalysisContext } from '@/services/history-cache/activeAnalysisContext';
import { readLatestAnalysisRun } from '@/services/history-cache/latestAnalysisRun';
import { clearWorkflowActivity, clearWorkflowDraft } from '@/services/history-cache/workflowDraft';
import { getWorkspaceSessionStatus, setWorkspaceSessionStatus } from '@/services/workspace/workspaceSessionState';

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';

function resolveCurrentWorkspaceSessionId(): string | null {
  const activeContext = getActiveAnalysisContext();
  if (activeContext?.historyId) return activeContext.historyId;
  if (activeContext?.sessionId && !activeContext.sessionId.startsWith('analysis-')) {
    return activeContext.sessionId;
  }

  const latestRun = readLatestAnalysisRun();
  return latestRun ? `local-${latestRun.timestamp}` : null;
}

interface ContactCandidatesPageProps {
  candidates: Candidate[];
  jobPosition: string;
  onReset?: () => void;
}

const ContactCandidatesPage: React.FC<ContactCandidatesPageProps> = ({ candidates, jobPosition, onReset }) => {
  const navigate = useNavigate();
  const [hasSentEmail, setHasSentEmail] = useState(false);
  const ownerKey = (localStorage.getItem('authEmail') || 'local').toLowerCase();
  const sessionId = useMemo(() => resolveCurrentWorkspaceSessionId(), []);

  const { displayCandidates, fromChatbotSelection } = useMemo(() => {
    try {
      const raw = localStorage.getItem(SELECTED_IDS_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.length > 0) {
        const filtered = candidates.filter((candidate) => ids.includes(candidate.id) && candidate.status === 'SUCCESS');
        if (filtered.length > 0) {
          return { displayCandidates: filtered, fromChatbotSelection: true };
        }
      }
    } catch {
      // Ignore corrupted local shortlist state.
    }

    return {
      displayCandidates: candidates.filter((candidate) => candidate.status === 'SUCCESS'),
      fromChatbotSelection: false,
    };
  }, [candidates]);

  const feedbackByCandidate = useMemo<Record<string, AnalysisFeedbackRecord>>(() => {
    const map: Record<string, AnalysisFeedbackRecord> = {};

    displayCandidates.forEach((candidate) => {
      const action = fromChatbotSelection ? 'shortlist' : (() => {
        const analysis = candidate.analysis as Record<string, unknown> | undefined;
        const score = typeof analysis?.['Tổng điểm'] === 'number' ? (analysis['Tổng điểm'] as number) : 0;
        return score >= 65 ? 'shortlist' : 'reject';
      })();

      map[candidate.id] = {
        id: `auto-${candidate.id}`,
        uid: '',
        userEmail: '',
        displayName: '',
        photoUrl: '',
        action,
        candidateId: candidate.id,
        candidateName: candidate.candidateName,
        fileName: candidate.fileName,
        jobPosition,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } satisfies AnalysisFeedbackRecord;
    });

    return map;
  }, [displayCandidates, fromChatbotSelection, jobPosition]);

  useEffect(() => {
    if (!sessionId) return;
    const fallbackStatus: WorkspaceSessionStatus = displayCandidates.length > 0 ? 'review' : 'open';
    const currentStatus = getWorkspaceSessionStatus(ownerKey, sessionId, fallbackStatus);
    if (currentStatus !== 'completed') {
      setWorkspaceSessionStatus(ownerKey, sessionId, 'review');
    }
  }, [displayCandidates.length, ownerKey, sessionId]);

  const handleFinish = () => {
    if (sessionId) {
      setWorkspaceSessionStatus(ownerKey, sessionId, hasSentEmail ? 'completed' : 'review');
    }
    clearWorkflowDraft();
    clearWorkflowActivity();
    onReset?.();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <CandidateEmailNotifier
          candidates={displayCandidates}
          feedbackByCandidate={feedbackByCandidate}
          jobPosition={jobPosition}
          onClose={() => navigate('/chatbot')}
          onSendSuccess={(sentCount) => {
            if (sentCount > 0) {
              setHasSentEmail(true);
              if (sessionId) {
                setWorkspaceSessionStatus(ownerKey, sessionId, 'completed');
              }
            }
          }}
          inline
        />
      </div>

      <div
        className="shrink-0 border-t border-[#e5e7eb] bg-white px-6 py-3"
        style={{ boxShadow: '0 -1px 0 0 rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#9ca3af]">
            Ấn <strong>Hoàn thành</strong> để kết thúc phiên lọc và quay về trang chủ.
          </p>
          <button
            type="button"
            onClick={handleFinish}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            <CheckCircle2 size={15} />
            Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactCandidatesPage;
