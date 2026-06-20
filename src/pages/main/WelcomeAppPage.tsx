import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Building2,
  ChevronRight,
  Cpu,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Workflow,
} from 'lucide-react';

interface WelcomeAppPageProps {
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

const metrics = [
  { label: 'Tổng CV đã xử lý', value: '128K+', detail: 'Pipeline nhiều lớp cho web và desktop.' },
  { label: 'Tỷ lệ chính xác đối sánh', value: '96.4%', detail: 'Khung chỉ số enterprise ưu tiên độ rõ ràng.' },
  { label: 'Thời gian trích xuất', value: '18s', detail: 'Sẵn sàng cho baseline tương tác drag & drop.' },
  { label: 'Phiên đồng bộ đang hoạt động', value: '24/7', detail: 'Thiết kế chừa không gian cho desktop wrapper.' },
];

const processSteps = [
  {
    title: 'Chuẩn hóa JD',
    description: 'Làm sạch yêu cầu tuyển dụng, chuẩn hóa tiêu chí và thống nhất ngôn ngữ đầu vào.',
  },
  {
    title: 'Trích xuất tín hiệu CV',
    description: 'Tách kỹ năng, kinh nghiệm và bằng chứng liên quan từ hồ sơ ứng viên.',
  },
  {
    title: 'Đối sánh Vector Embeddings',
    description: 'So sánh ngữ nghĩa giữa JD và CV bằng pipeline embedding có thể mở rộng.',
  },
  {
    title: 'Xếp hạng shortlist',
    description: 'Đưa ra đề xuất hành động rõ ràng cho đội tuyển dụng và bộ phận vận hành.',
  },
];

const proofItems = ['Cross-platform Web & PC', 'Semantic HTML baseline', 'Glass enterprise surfaces'];
const metricFloatDurations = [4, 5, 6, 5.5];

function SectionShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-supporthr-shell px-4 sm:px-6 lg:px-8 xl:px-10 ${className}`}>{children}</div>;
}

function GlassPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/80 bg-white/65 shadow-supporthr-card backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function EnterpriseHeader({
  isLoggedIn,
  onPrimaryAction,
}: {
  isLoggedIn: boolean;
  onPrimaryAction: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-supporthr-border/80 bg-supporthr-surface-glass backdrop-blur-supporthr">
      <SectionShell>
        <div className="flex min-h-[76px] items-center justify-between gap-4 lg:min-h-[88px]">
          <a href="#hero" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-supporthr-accent to-supporthr-accent-sky text-white shadow-supporthr-card">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.2em] text-supporthr-muted">Support HR</p>
              <p className="truncate text-base font-semibold text-supporthr-ink">Enterprise Homepage Baseline</p>
            </div>
          </a>

          <nav aria-label="Homepage sections" className="hidden items-center gap-2 lg:flex">
            <a className="rounded-full px-4 py-2 text-sm font-medium text-supporthr-muted transition-colors hover:text-supporthr-accent" href="#hero">
              Hero
            </a>
            <a className="rounded-full px-4 py-2 text-sm font-medium text-supporthr-muted transition-colors hover:text-supporthr-accent" href="#metrics">
              Metrics
            </a>
            <a className="rounded-full px-4 py-2 text-sm font-medium text-supporthr-muted transition-colors hover:text-supporthr-accent" href="#process">
              AI Process
            </a>
            <a className="rounded-full px-4 py-2 text-sm font-medium text-supporthr-muted transition-colors hover:text-supporthr-accent" href="#cta">
              CTA
            </a>
          </nav>

          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex items-center gap-2 rounded-full bg-supporthr-accent px-5 py-3 text-sm font-semibold text-white shadow-supporthr-card transition-colors duration-300 hover:bg-supporthr-accent-sky"
          >
            {isLoggedIn ? 'Mở workspace' : 'Đăng nhập'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </SectionShell>
    </header>
  );
}

function HeroSection({
  isLoggedIn,
  onPrimaryAction,
  onSecondaryAction,
}: {
  isLoggedIn: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="hero" className="relative overflow-hidden py-10 sm:py-14 lg:py-20">
      <SectionShell>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] xl:items-center">
          <article className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-supporthr-border bg-white/80 px-4 py-2 text-sm font-medium text-supporthr-muted shadow-supporthr-card">
              <Building2 className="h-4 w-4 text-supporthr-accent" />
              Antigravity x Enterprise baseline cho Web và PC
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-supporthr-ink sm:text-5xl xl:text-6xl">
              Homepage nền tảng cho hệ thống lọc CV và chuẩn hóa JD bằng AI.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-supporthr-muted sm:text-lg">
              Giai đoạn 1 chỉ dựng baseline architecture: token màu, semantic layout 5 phần và skeleton grid đủ ổn định để bước sang animation ở vòng sau.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-supporthr-accent px-6 py-3.5 text-sm font-semibold text-white shadow-supporthr-card transition-colors duration-300 hover:bg-supporthr-accent-sky"
              >
                {isLoggedIn ? 'Tiếp tục sàng lọc' : 'Đăng nhập để bắt đầu'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-supporthr-border bg-white px-6 py-3.5 text-sm font-semibold text-supporthr-ink shadow-supporthr-card transition-colors duration-300 hover:border-supporthr-accent hover:text-supporthr-accent"
              >
                Xem tài liệu hệ thống
              </button>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {proofItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-2xl border border-supporthr-border bg-white/80 px-4 py-3 text-sm text-supporthr-muted shadow-supporthr-card"
                >
                  <BadgeCheck className="h-4 w-4 shrink-0 text-supporthr-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <aside className="min-w-0">
            <GlassPanel className="overflow-hidden p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-supporthr-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-supporthr-ink">Dropzone Skeleton</p>
                  <p className="mt-1 text-sm text-supporthr-muted">Chuẩn bị cho Phase 2 drag & drop interaction.</p>
                </div>
                <span className="rounded-full bg-supporthr-accent-soft px-3 py-1 text-xs font-semibold text-supporthr-accent">
                  Desktop-safe spacing
                </span>
              </div>

              <motion.div
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.01,
                      }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }
                }
                className="mt-5 rounded-[28px] border-2 border-dashed border-slate-200/80 bg-white/65 p-6 backdrop-blur-md sm:p-8"
                style={{ willChange: shouldReduceMotion ? undefined : 'transform' }}
              >
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-supporthr-accent shadow-supporthr-card">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-supporthr-ink">Kéo CV vào đây hoặc chọn tệp từ máy</p>
                    <p className="mt-2 text-sm leading-7 text-supporthr-muted">
                      Baseline này mới dựng khung semantic và responsive. Hiệu ứng spring và trạng thái upload sẽ được thêm ở Giai đoạn 2 và 3.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-supporthr-border bg-white p-4 shadow-supporthr-card">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-supporthr-muted">Khung nhập liệu</p>
                    <p className="mt-3 text-sm leading-7 text-supporthr-ink">JD input, CV intake và validation panel sẽ dùng cùng hệ token này để đồng bộ giữa web và desktop wrapper.</p>
                  </div>
                  <div className="rounded-2xl border border-supporthr-border bg-white p-4 shadow-supporthr-card">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-supporthr-muted">PC titlebar reserve</p>
                    <p className="mt-3 text-sm leading-7 text-supporthr-ink">Khoảng thở phía trên đã được giữ rộng hơn để sau này gắn Electron/Tauri shell mà không va vào vùng điều hướng.</p>
                  </div>
                </div>
              </motion.div>
            </GlassPanel>
          </aside>
        </div>
      </SectionShell>
    </section>
  );
}

function MetricsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="metrics" className="border-y border-supporthr-border/80 bg-white/60 py-12 sm:py-14 lg:py-16">
      <SectionShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-supporthr-accent">Metrics dashboard grid</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-supporthr-ink sm:text-4xl">
              Dashboard baseline có cấu trúc rõ ràng trước khi thêm chuyển động.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-supporthr-muted">
            Mỗi card đang dùng cùng glass surface, border và layered shadow token để sau này chỉ cần gắn animation vào đúng khung có sẵn.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <li key={metric.label}>
              <motion.div
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: [0, -10, 0],
                      }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        repeat: Infinity,
                        duration: metricFloatDurations[index % metricFloatDurations.length],
                        ease: 'easeInOut',
                        delay: index * 0.18,
                      }
                }
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 1.02,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                      }
                }
                className="h-full will-change-transform"
              >
                <GlassPanel className="h-full p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-supporthr-muted">{metric.label}</span>
                    <LayoutGrid className="h-5 w-5 text-supporthr-accent" />
                  </div>
                  <p className="mt-6 text-4xl font-semibold tracking-tight text-supporthr-ink">{metric.value}</p>
                  <p className="mt-4 text-sm leading-7 text-supporthr-muted">{metric.detail}</p>
                </GlassPanel>
              </motion.div>
            </li>
          ))}
        </ul>
      </SectionShell>
    </section>
  );
}

function ProcessSection() {
  return (
    <section id="process" className="py-12 sm:py-14 lg:py-20">
      <SectionShell>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <article className="min-w-0">
            <GlassPanel className="h-full p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-supporthr-accent">AI process showcase</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-supporthr-ink sm:text-4xl">
                Khung mô phỏng pipeline kỹ thuật đã sẵn để nâng cấp ở các phase tiếp theo.
              </h2>
              <p className="mt-5 text-sm leading-8 text-supporthr-muted sm:text-base">
                Ở baseline này, phần quy trình chỉ tập trung phân cấp nội dung, grid và semantic structure. Chưa có state machine, animation hay micro-interaction.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-supporthr-border bg-white p-4 shadow-supporthr-card">
                  <Cpu className="h-5 w-5 text-supporthr-accent" />
                  <p className="mt-4 text-base font-semibold text-supporthr-ink">Semantic-first</p>
                  <p className="mt-2 text-sm leading-7 text-supporthr-muted">Section, article, aside, ol, ul và footer được tách rõ để giữ nền vững cho SEO và maintainability.</p>
                </div>
                <div className="rounded-2xl border border-supporthr-border bg-white p-4 shadow-supporthr-card">
                  <ShieldCheck className="h-5 w-5 text-supporthr-accent-sky" />
                  <p className="mt-4 text-base font-semibold text-supporthr-ink">Responsive-first</p>
                  <p className="mt-2 text-sm leading-7 text-supporthr-muted">Tỷ lệ cột và container width được khóa theo desktop rộng nhưng vẫn co gọn sạch trên web thường.</p>
                </div>
              </div>
            </GlassPanel>
          </article>

          <aside className="min-w-0">
            <ol className="grid gap-4">
              {processSteps.map((step, index) => (
                <li key={step.title}>
                  <GlassPanel className="p-5 sm:p-6 transition-shadow duration-300 hover:shadow-supporthr-float">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-supporthr-accent-soft to-supporthr-accent-sky-soft text-supporthr-accent shadow-supporthr-card">
                        {index % 2 === 0 ? <Workflow className="h-5 w-5" /> : <BrainCircuit className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-supporthr-muted">Bước {index + 1}</p>
                        <h3 className="mt-2 text-xl font-semibold text-supporthr-ink">{step.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-supporthr-muted">{step.description}</p>
                      </div>
                    </div>
                  </GlassPanel>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </SectionShell>
    </section>
  );
}

function EnterpriseFooter({
  isLoggedIn,
  onPrimaryAction,
  onSecondaryAction,
}: {
  isLoggedIn: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}) {
  return (
    <footer id="cta" className="border-t border-supporthr-border/80 pb-10 pt-6 sm:pb-12 lg:pb-16">
      <SectionShell>
        <GlassPanel className="overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-supporthr-accent">Enterprise footer & call to action</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-supporthr-ink sm:text-4xl">
                Baseline layout đã sẵn sàng cho review trước khi thêm Framer Motion ở Giai đoạn 2.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-supporthr-muted sm:text-base">
                Cấu trúc này giữ đúng tinh thần tài liệu: nền sáng enterprise, card kính mờ, grid sạch và không đẩy quá sớm sang layer animation.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-supporthr-accent px-6 py-3.5 text-sm font-semibold text-white shadow-supporthr-card transition-colors duration-300 hover:bg-supporthr-accent-sky"
              >
                {isLoggedIn ? 'Mở luồng phân tích' : 'Đăng nhập vào Support HR'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-supporthr-border bg-white px-6 py-3.5 text-sm font-semibold text-supporthr-ink shadow-supporthr-card transition-colors duration-300 hover:border-supporthr-accent hover:text-supporthr-accent"
              >
                Mở documentation
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-supporthr-border pt-6 md:grid-cols-3">
            <div className="rounded-2xl border border-supporthr-border bg-white p-4 shadow-supporthr-card">
              <p className="text-sm font-semibold text-supporthr-ink">Token system</p>
              <p className="mt-2 text-sm leading-7 text-supporthr-muted">Palette, shadow, blur và container width đã được đẩy vào Tailwind config để tái dùng toàn site.</p>
            </div>
            <div className="rounded-2xl border border-supporthr-border bg-white p-4 shadow-supporthr-card">
              <p className="text-sm font-semibold text-supporthr-ink">Cross-platform shell</p>
              <p className="mt-2 text-sm leading-7 text-supporthr-muted">Layout chừa nhịp thở phía trên và giữ giới hạn chiều rộng phù hợp cho màn hình desktop lớn.</p>
            </div>
            <div className="rounded-2xl border border-supporthr-border bg-white p-4 shadow-supporthr-card">
              <p className="text-sm font-semibold text-supporthr-ink">Phase boundary</p>
              <p className="mt-2 text-sm leading-7 text-supporthr-muted">Chưa thêm motion, chưa thêm state upload giả lập và chưa chạm smooth scroll theo đúng yêu cầu phase.</p>
            </div>
          </div>
        </GlassPanel>

        <div className="mt-6 flex flex-col gap-3 border-t border-supporthr-border/70 pt-5 text-sm text-supporthr-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Support HR — baseline homepage architecture for Web and Desktop wrapper.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Semantic HTML</span>
            <span>Tailwind tokens</span>
            <span>Responsive grid</span>
          </div>
        </div>
      </SectionShell>
    </footer>
  );
}

const WelcomeAppPage: React.FC<WelcomeAppPageProps> = ({ isLoggedIn, onLoginRequest }) => {
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    if (isLoggedIn) {
      navigate('/jd');
      return;
    }

    onLoginRequest();
  };

  const handleSecondaryAction = () => {
    navigate('/app-docs');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-supporthr-background text-supporthr-ink">
      <div className="pointer-events-none absolute inset-0 bg-supporthr-hero-glow" />
      <div className="pointer-events-none absolute inset-0 bg-supporthr-grid bg-[length:56px_56px] opacity-40 [mask-image:radial-gradient(circle_at_top,black,transparent_72%)]" />
      <div className="pointer-events-none absolute left-[-10%] top-20 h-72 w-72 rounded-full bg-supporthr-accent-soft/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 right-[-6%] h-80 w-80 rounded-full bg-supporthr-accent-sky-soft/80 blur-3xl" />

      <EnterpriseHeader isLoggedIn={isLoggedIn} onPrimaryAction={handlePrimaryAction} />

      <main className="relative z-10">
        <HeroSection
          isLoggedIn={isLoggedIn}
          onPrimaryAction={handlePrimaryAction}
          onSecondaryAction={handleSecondaryAction}
        />
        <MetricsSection />
        <ProcessSection />
      </main>

      <EnterpriseFooter
        isLoggedIn={isLoggedIn}
        onPrimaryAction={handlePrimaryAction}
        onSecondaryAction={handleSecondaryAction}
      />
    </div>
  );
};

export default WelcomeAppPage;
