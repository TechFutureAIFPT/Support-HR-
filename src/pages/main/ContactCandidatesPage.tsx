import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { AnalysisFeedbackRecord, Candidate } from '@/types';
import CandidateEmailNotifier from '@/features/email/CandidateEmailNotifier';
import { clearWorkflowActivity, clearWorkflowDraft } from '@/services/history-cache/workflowDraft';

const SELECTED_IDS_KEY = 'supporthr.selectedCandidateIds';

interface ContactCandidatesPageProps {
  candidates: Candidate[];
  jobPosition: string;
  onReset?: () => void;
}

const ContactCandidatesPage: React.FC<ContactCandidatesPageProps> = ({ candidates, jobPosition, onReset }) => {
  const navigate = useNavigate();

  // Sync with chatbot selection: only show candidates the user picked
  // Fallback to all successful candidates if no selection exists
  const { displayCandidates, fromChatbotSelection } = useMemo(() => {
    try {
      const raw = localStorage.getItem(SELECTED_IDS_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.length > 0) {
        const filtered = candidates.filter(c => ids.includes(c.id) && c.status === 'SUCCESS');
        if (filtered.length > 0) return { displayCandidates: filtered, fromChatbotSelection: true };
      }
    } catch { /* ignore */ }
    return {
      displayCandidates: candidates.filter(c => c.status === 'SUCCESS'),
      fromChatbotSelection: false,
    };
  }, [candidates]);

  const feedbackByCandidate = useMemo<Record<string, AnalysisFeedbackRecord>>(() => {
    const map: Record<string, AnalysisFeedbackRecord> = {};
    displayCandidates.forEach((c) => {
      // Chatbot-selected candidates are explicitly shortlisted by the recruiter;
      // direct-access fallback uses score threshold
      const action = fromChatbotSelection ? 'shortlist' : (() => {
        const analysis = c.analysis as Record<string, unknown> | undefined;
        const score = typeof analysis?.['Tổng điểm'] === 'number' ? (analysis['Tổng điểm'] as number) : 0;
        return score >= 65 ? 'shortlist' : 'reject';
      })();
      map[c.id] = {
        id: `auto-${c.id}`,
        uid: '',
        userEmail: '',
        displayName: '',
        photoUrl: '',
        action,
        candidateId: c.id,
        candidateName: c.candidateName,
        fileName: c.fileName,
        jobPosition,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } satisfies AnalysisFeedbackRecord;
    });
    return map;
  }, [displayCandidates, fromChatbotSelection, jobPosition]);

  const handleFinish = () => {
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
