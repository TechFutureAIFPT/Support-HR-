import React from 'react';
import { Link } from 'react-router-dom';
import { DocsFooter, DocsHeaderTabs, DocsTopBar } from '@/pages/info/legal-ui';
import { productDocsTabs } from '@/pages/info/docs-header-tabs';

interface ProcessPageProps {
  isIntroMode?: boolean;
  onStart?: () => void;
}

const PROCESS_STEPS = [
  {
    icon: 'fa-clipboard-list',
    title: 'Nhập JD và xác định vai trò',
    description: 'Bắt đầu bằng mô tả công việc, vị trí tuyển dụng và các yêu cầu cứng cần giữ trong suốt phiên sàng lọc.',
    step: '01',
  },
  {
    icon: 'fa-folder-open',
    title: 'Đưa CV vào cùng một phiên',
    description: 'Tải file trực tiếp hoặc chọn tài liệu từ Google Drive để gom ứng viên vào một bề mặt rà soát thống nhất.',
    step: '02',
  },
  {
    icon: 'fa-sliders',
    title: 'Thiết lập tiêu chí và trọng số',
    description: 'Điều chỉnh kỹ năng, kinh nghiệm, địa điểm, học vấn và mức độ ưu tiên theo đúng nhu cầu tuyển dụng.',
    step: '03',
  },
  {
    icon: 'fa-wand-magic-sparkles',
    title: 'AI chấm điểm và giải thích',
    description: 'Hệ thống đối chiếu CV với JD, tạo điểm số, xếp hạng và lý do đề cử để recruiter kiểm tra lại.',
    step: '04',
  },
  {
    icon: 'fa-user-check',
    title: 'Chốt shortlist và bàn giao',
    description: 'Danh sách đề cử được dùng cho vòng phỏng vấn, báo cáo nội bộ hoặc trao đổi tiếp với hiring manager.',
    step: '05',
  },
];

function ProcessContent({ isIntroMode, onStart }: ProcessPageProps) {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-[#f5d6bb]">Workflow</p>
        <h1 className="mt-3 text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-white">
          Quy trình sàng lọc CV thông minh
        </h1>
        <p className="mt-4 text-base leading-8 text-zinc-400 sm:text-lg">
          Luồng 5 bước giúp đội tuyển dụng đi từ JD, CV đầu vào đến shortlist có thể rà soát mà không biến quy trình thành hộp đen.
        </p>
      </header>

      <section className="mt-8 grid gap-3 lg:grid-cols-5">
        {PROCESS_STEPS.map((step) => (
          <article key={step.step} className="relative border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-10 w-10 items-center justify-center border border-[#f5d6bb]/22 bg-[#f5d6bb]/[0.06] text-[#f5d6bb]">
                <i className={`fa-solid ${step.icon} text-sm`} />
              </span>
              <span className="supporthr-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">{step.step}</span>
            </div>
            <h2 className="mt-5 text-base font-semibold leading-6 text-white">{step.title}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-500">{step.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Nhịp thao tác', value: '5 bước', icon: 'fa-route' },
          { label: 'Nguồn CV', value: 'Upload + Drive', icon: 'fa-file-import' },
          { label: 'Đầu ra', value: 'Shortlist có lý do', icon: 'fa-clipboard-check' },
        ].map((stat) => (
          <div key={stat.label} className="border border-white/10 bg-black/35 px-5 py-4">
            <i className={`fa-solid ${stat.icon} text-sm text-[#f5d6bb]`} />
            <p className="mt-3 text-lg font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {isIntroMode ? (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-11 items-center justify-center bg-white px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-100"
          >
            Bắt đầu sàng lọc
          </button>
        ) : (
          <>
            <Link
              to="/guide"
              className="inline-flex h-11 items-center justify-center bg-white px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-100"
            >
              Xem hướng dẫn
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex h-11 items-center justify-center border border-white/12 px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
            >
              Đặt lịch demo
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

const ProcessPage: React.FC<ProcessPageProps> = ({ isIntroMode = false, onStart }) => {
  if (isIntroMode) {
    return (
      <div className="feature-page-shell">
        <ProcessContent isIntroMode onStart={onStart} />
      </div>
    );
  }

  return (
    <div className="legal-page-shell min-h-screen overflow-x-hidden bg-black text-zinc-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-25" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent)]" />
      </div>
      <div className="relative z-10">
        <DocsTopBar brandContext="Tài liệu doanh nghiệp" auxiliaryLink={{ label: 'Bảng giá', to: '/pricing' }} />
        <DocsHeaderTabs tabs={productDocsTabs} />
        <ProcessContent />
        <DocsFooter />
      </div>
    </div>
  );
};

export default ProcessPage;
