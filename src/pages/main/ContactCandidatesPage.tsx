import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
          onFinish={handleFinish}
          inline
        />
      </div>
    </div>
  );
};

export default ContactCandidatesPage;
