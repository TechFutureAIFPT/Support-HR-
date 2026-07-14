import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ClipboardList,
  CloudUpload,
  Eye,
  FileSearch,
  FileText,
  FolderKanban,
  ListChecks,
  Mail,
  MessageSquareText,
  Mic,
  Quote,
  Scale,
  Smartphone,
  Sparkles,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';

interface LandingPageProps {
  onLoginRequest: () => void;
  /** Đã đăng nhập (hoặc còn phiên cache): hiện nút vào thẳng không gian làm việc. */
  isLoggedIn?: boolean;
}

const NAV_LINKS = [
  { label: 'Tính năng', href: '#tinh-nang' },
  { label: 'So sánh', href: '#so-sanh' },
  { label: 'Quy trình', href: '#cach-hoat-dong' },
  { label: 'Công cụ', href: '#cong-cu' },
  { label: 'Ứng dụng di động', href: '#mobile-app' },
  { label: 'Tài liệu', href: '/app-docs' },
];

const VALUE_STRIP = [
  { icon: Eye, label: 'Đánh giá có giải thích', description: 'Mỗi điểm số đều kèm bằng chứng từ CV' },
  { icon: Scale, label: 'Quy trình minh bạch', description: 'Tiêu chí và trọng số do chính bạn đặt' },
  { icon: FolderKanban, label: 'Dữ liệu tập trung', description: 'JD, CV, kết quả phân tích ở một nơi' },
  { icon: Users, label: 'Hỗ trợ quyết định', description: 'AI đề xuất, HR quyết định cuối cùng' },
];

const PROBLEM_SOLUTIONS = [
  {
    problem: 'HR mất hàng giờ đọc từng CV trong khi vị trí cần tuyển gấp.',
    solution: 'Nạp tối đa 20 CV mỗi lượt, AI đọc và chấm điểm trong vài phút.',
  },
  {
    problem: 'Mỗi người đánh giá một kiểu, khó so sánh ứng viên đồng nhất.',
    solution: 'Một bộ tiêu chí + trọng số thống nhất áp dụng cho mọi hồ sơ.',
  },
  {
    problem: 'Dữ liệu ứng viên phân tán trong email, file Excel và ổ đĩa.',
    solution: 'Thư viện CV và lịch sử phân tích tập trung, tìm lại trong vài giây.',
  },
  {
    problem: 'Ứng viên phù hợp dễ bị bỏ sót khi hồ sơ quá nhiều.',
    solution: 'Xếp hạng tự động kèm lý do — hồ sơ tốt luôn nổi lên đầu danh sách.',
  },
];

const COMPARISON_ROWS = [
  {
    label: 'Thời gian đọc 20 CV',
    manual: 'Vài giờ đến cả buổi làm việc',
    supporthr: 'Vài phút cho cả lượt phân tích',
  },
  {
    label: 'Tiêu chí đánh giá',
    manual: 'Theo cảm nhận từng người đọc',
    supporthr: 'Bộ trọng số thống nhất do bạn cấu hình',
  },
  {
    label: 'Bằng chứng đánh giá',
    manual: 'Ghi chú rời rạc, khó truy lại',
    supporthr: 'Trích dẫn từ CV gắn với từng tiêu chí',
  },
  {
    label: 'So sánh ứng viên',
    manual: 'Mở từng file, đối chiếu thủ công',
    supporthr: 'Bảng xếp hạng kèm điểm và phân hạng A/B/C',
  },
  {
    label: 'Lưu trữ & tra cứu',
    manual: 'Email, Excel, ổ đĩa phân tán',
    supporthr: 'Thư viện CV + lịch sử phiên tập trung',
  },
  {
    label: 'Phản hồi ứng viên',
    manual: 'Soạn email từng người',
    supporthr: 'Gửi thông báo kết quả theo nhóm ngay trong app',
  },
];

const FEATURES = [
  {
    icon: FileSearch,
    title: 'AI phân tích CV theo yêu cầu công việc',
    description: 'Bóc tách kinh nghiệm, kỹ năng, học vấn từ CV rồi đối chiếu với từng tiêu chí trong JD của bạn.',
    bullets: ['Hỗ trợ PDF, DOCX, ảnh chụp CV', 'Nạp từ máy tính hoặc Google Drive', 'Lọc cứng theo địa điểm, kinh nghiệm'],
  },
  {
    icon: ListChecks,
    title: 'Xếp hạng ứng viên có giải thích',
    description: 'Điểm phù hợp kèm bằng chứng trích từ CV, điểm mạnh và điểm cần xác minh — không phải con số vô hồn.',
    bullets: ['Phân hạng A/B/C có lý do', 'Bằng chứng trích dẫn từng tiêu chí', 'Câu hỏi phỏng vấn gợi ý theo hồ sơ'],
  },
  {
    icon: Sparkles,
    title: 'Chuẩn hóa JD và thư viện mẫu',
    description: 'Biến mô tả công việc thô thành JD rõ ràng, đủ mục; lưu lại thành mẫu để tái sử dụng cho lần sau.',
    bullets: ['Tự nhận diện tiêu đề, yêu cầu, quyền lợi', 'Thư viện mẫu JD theo ngành', 'AI đề xuất, bạn duyệt từng phần'],
  },
  {
    icon: FolderKanban,
    title: 'Quản lý phiên tuyển dụng tập trung',
    description: 'Theo dõi trạng thái từng phiên sàng lọc, thư viện CV đã phân tích và lịch sử hoạt động trên một màn hình.',
    bullets: ['Trạng thái phiên: mở, duyệt, hoàn thành', 'Thư viện CV tìm kiếm nhanh', 'Gửi thông báo kết quả cho ứng viên'],
  },
  {
    icon: BarChart3,
    title: 'Báo cáo và phân tích chi tiết',
    description: 'Nhìn tổng thể chất lượng nguồn ứng viên: phân bố điểm, kỹ năng phổ biến, kỹ năng còn thiếu.',
    bullets: ['Phân bố điểm phù hợp theo phiên', 'Kỹ năng xuất hiện nhiều nhất', 'Xuất dữ liệu CSV khi cần'],
  },
  {
    icon: MessageSquareText,
    title: 'Học từ phản hồi của nhà tuyển dụng',
    description: 'HR chấm lại và ghi nhận quyết định thực tế; hệ thống ghi nhận khác biệt để cải thiện độ chính xác dần.',
    bullets: ['Phản hồi từng ứng viên', 'So sánh đánh giá AI và HR', 'Trợ lý AI trả lời theo dữ liệu phiên'],
  },
];

const TOOLS = [
  { icon: Upload, name: 'Nạp hồ sơ ứng viên', description: 'Kéo thả CV hàng loạt, hỗ trợ Google Drive' },
  { icon: ClipboardList, name: 'Kết quả phân tích', description: 'Bảng xếp hạng kèm bằng chứng từng tiêu chí' },
  { icon: BarChart3, name: 'Phân tích chi tiết', description: 'Biểu đồ phân bố điểm, kỹ năng nguồn ứng viên' },
  { icon: User, name: 'Thư viện CV', description: 'Kho hồ sơ đã phân tích, tìm kiếm và xuất CSV' },
  { icon: Mail, name: 'Liên hệ ứng viên', description: 'Gửi thông báo kết quả, lịch phỏng vấn theo nhóm' },
  { icon: Bot, name: 'Trợ lý tuyển dụng AI', description: 'Hỏi đáp, so sánh và đào sâu từng ứng viên' },
  { icon: Sparkles, name: 'Chuẩn hóa JD', description: 'Biến JD thô thành bản rõ ràng, sẵn sàng cho AI' },
  { icon: FileText, name: 'Thư viện mẫu JD', description: 'Mẫu JD theo ngành, tái sử dụng một chạm' },
  { icon: MessageSquareText, name: 'Phản hồi kết quả AI', description: 'Chấm lại, ghi nhận quyết định của HR' },
];

const HOW_IT_WORKS = [
  { icon: ClipboardList, title: 'Nhập mô tả công việc', description: 'Dán JD hoặc chọn từ thư viện mẫu, hệ thống tự chuẩn hóa.' },
  { icon: Upload, title: 'Nạp CV ứng viên', description: 'Kéo thả hàng loạt CV từ máy tính hoặc Google Drive.' },
  { icon: Sparkles, title: 'AI phân tích và đề xuất', description: 'Chấm điểm theo tiêu chí, xếp hạng kèm giải thích và bằng chứng.' },
  { icon: CheckCircle2, title: 'HR đánh giá và quyết định', description: 'Xem bằng chứng, phản hồi kết quả, gửi thông báo cho ứng viên.' },
];

const TESTIMONIALS = [
  {
    quote:
      'Trước đây mỗi đợt tuyển tôi phải đọc thủ công cả trăm CV. Giờ chỉ cần nạp lên, vài phút sau đã có danh sách xếp hạng kèm lý do — tôi chỉ tập trung vào nhóm nổi bật.',
    author: 'Trưởng phòng Nhân sự',
    context: 'Doanh nghiệp phân phối, quy mô 200+ nhân sự',
  },
  {
    quote:
      'Điều tôi thích nhất là phần bằng chứng. AI không chỉ nói "phù hợp 80%" mà chỉ rõ trích đoạn nào trong CV khớp với yêu cầu nào — rất dễ trao đổi lại với hiring manager.',
    author: 'Chuyên viên Tuyển dụng',
    context: 'Công ty công nghệ, tuyển vị trí IT',
  },
  {
    quote:
      'Bộ lọc cứng theo địa điểm và số năm kinh nghiệm giúp loại đúng hồ sơ chưa đạt điều kiện bắt buộc, đội tôi không còn mất thời gian vào những CV chắc chắn không phù hợp.',
    author: 'HR Manager',
    context: 'Doanh nghiệp sản xuất',
  },
];

const PARTNERS = [
  { name: 'FPT', logo: '/images/logos/fpt.png' },
  { name: 'TopCV', logo: '/images/logos/topcv-1.png' },
  { name: 'Vinedimex', logo: '/images/logos/vinedimex-1.png' },
  { name: 'HB', logo: '/images/logos/hb.png' },
  { name: 'Mì AI', logo: '/images/logos/mi_ai.png' },
];

const MOBILE_FEATURES = [
  { icon: Bell, text: 'Nhận thông báo khi phân tích hoàn tất, xem kết quả mọi lúc' },
  { icon: ListChecks, text: 'Duyệt danh sách xếp hạng và bằng chứng ngay trên điện thoại' },
  { icon: Mic, text: 'Nhập liệu bằng giọng nói khi thao tác di chuyển' },
  { icon: CloudUpload, text: 'Đồng bộ dữ liệu với tài khoản SupportHR trên web' },
];

const HERO_CANDIDATES = [
  { initials: 'TL', name: 'Trần Thùy Linh', role: 'Backend Developer', score: 86, tone: 'high' as const, label: 'Rất phù hợp' },
  { initials: 'NM', name: 'Ngô Đức Minh', role: 'Backend Developer', score: 72, tone: 'mid' as const, label: 'Phù hợp' },
  { initials: 'PH', name: 'Phạm Gia Huy', role: 'Backend Developer', score: 55, tone: 'low' as const, label: 'Cần xem xét' },
];

const scoreTone = {
  high: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', bar: 'bg-emerald-600' },
  mid: { badge: 'bg-[#1d4e89]/[0.08] text-[#1d4e89] border-[#1d4e89]/25', bar: 'bg-[#1d4e89]' },
  low: { badge: 'bg-amber-50 text-amber-800 border-amber-300', bar: 'bg-amber-500' },
};

/**
 * Progressive enhancement cho hiệu ứng fade-up:
 * - Nội dung MẶC ĐỊNH hiển thị (CSS không ẩn gì khi thiếu JS).
 * - Hook chỉ "vũ trang" ([data-armed]) các phần tử nằm DƯỚI viewport,
 *   rồi IntersectionObserver hiện chúng khi cuộn tới.
 * - Trường hợp xấu nhất (JS treo giữa chừng): chỉ phần dưới màn hình chờ
 *   hiệu ứng, phần đang xem không bao giờ trống.
 */
function useScrollReveal(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const viewportBottom = window.innerHeight;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('.landing-reveal')).filter((el) => {
      // Chỉ tạo hiệu ứng cho phần tử chưa vào khung nhìn.
      return el.getBoundingClientRect().top > viewportBottom - 40;
    });
    if (!targets.length) return;

    targets.forEach((el) => el.setAttribute('data-armed', ''));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      // Dọn trạng thái để không khóa nội dung nếu component remount.
      targets.forEach((el) => {
        el.classList.add('is-visible');
      });
    };
  }, [rootRef]);
}

const BrandLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <img
    src="/images/logos/logo.jpg"
    alt="SupportHR"
    width={size}
    height={size}
    className="rounded-lg object-cover"
    style={{ width: size, height: size }}
  />
);

const LandingPage: React.FC<LandingPageProps> = ({ onLoginRequest, isLoggedIn = false }) => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollReveal(rootRef);

  const goTo = (href: string) => {
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(href);
  };

  // Hành động chính: đã đăng nhập thì vào thẳng app, chưa thì mở form đăng nhập.
  const handlePrimaryAction = () => {
    if (isLoggedIn) {
      navigate('/workspace');
      return;
    }
    onLoginRequest();
  };
  const primaryCtaLabel = isLoggedIn ? 'Vào không gian làm việc' : 'Dùng thử miễn phí';

  return (
    <div ref={rootRef} className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandLogo />
            <span className="text-[17px] font-semibold tracking-tight">SupportHR</span>
          </div>
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Điều hướng trang chủ">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => goTo(link.href)}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#475467] transition-colors hover:bg-[#f2f4f7] hover:text-[#172033]"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => navigate('/workspace')}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#1d4e89] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#163a5f]"
              >
                Vào không gian làm việc
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onLoginRequest}
                  className="rounded-[10px] border border-[#d0d5dd] bg-white px-4 py-2 text-[13px] font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc]"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={onLoginRequest}
                  className="rounded-[10px] bg-[#1d4e89] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#163a5f]"
                >
                  Dùng thử SupportHR
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero-bg border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-2 lg:items-center lg:pb-16 lg:pt-12">
          <div>
            <p className="landing-reveal mb-4 inline-flex items-center gap-2 rounded-full border border-[#1d4e89]/20 bg-[#1d4e89]/[0.06] px-3 py-1 text-[12px] font-medium text-[#1d4e89]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Nền tảng tuyển dụng thông minh cho doanh nghiệp Việt
            </p>
            <h1 className="landing-reveal text-balance text-4xl font-bold leading-[1.12] tracking-[-0.02em] sm:text-[52px]" style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
              Tuyển đúng người
              <br />
              <span className="text-[#1d4e89]">nhanh hơn với AI</span>
            </h1>
            <p className="landing-reveal mt-5 max-w-xl text-[16px] leading-7 text-[#475467]" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
              SupportHR giúp doanh nghiệp phân tích CV, đánh giá mức độ phù hợp với yêu cầu công việc và quản
              lý toàn bộ quy trình sàng lọc trên một nền tảng duy nhất — minh bạch, có giải thích.
            </p>
            <div className="landing-reveal mt-8 flex flex-wrap items-center gap-3" style={{ '--reveal-delay': '180ms' } as React.CSSProperties}>
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#1d4e89] px-6 text-[15px] font-semibold text-white transition-all hover:bg-[#163a5f] hover:shadow-[0_8px_24px_rgba(29,78,137,0.25)]"
              >
                {primaryCtaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo('#cach-hoat-dong')}
                className="inline-flex h-12 items-center rounded-[10px] border border-[#d0d5dd] bg-white px-6 text-[15px] font-semibold text-[#344054] transition-colors hover:bg-[#f8fafc]"
              >
                Xem cách hoạt động
              </button>
            </div>
            <ul className="landing-reveal mt-8 grid max-w-lg gap-2 text-[13px] text-[#475467] sm:grid-cols-2" style={{ '--reveal-delay': '240ms' } as React.CSSProperties}>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#17915f]" aria-hidden="true" />Không cần thẻ tín dụng khi dùng thử</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#17915f]" aria-hidden="true" />Kết quả phân tích trong vài phút</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#17915f]" aria-hidden="true" />Hỗ trợ tiếng Việt trọn vẹn</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#17915f]" aria-hidden="true" />HR ra quyết định cuối cùng</li>
            </ul>
          </div>

          {/* Hero mockup — mô phỏng danh sách ứng viên thật của sản phẩm */}
          <div aria-hidden="true" className="landing-hero-card">
            <div className="rounded-xl border border-[#e4e7ec] bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.1)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">Backend Developer</p>
                  <p className="text-[11px] text-[#667085]">18 CV đã phân tích · 3 nổi bật</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                  <span className="landing-live-dot h-1.5 w-1.5 rounded-full bg-[#17915f]" />
                  Phân tích hoàn tất
                </span>
              </div>
              <div className="space-y-3">
                {HERO_CANDIDATES.map((candidate, index) => {
                  const tone = scoreTone[candidate.tone];
                  return (
                    <div key={candidate.name} className="landing-card-hover rounded-lg border border-[#eaecf0] p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d4e89]/10 text-[12px] font-semibold text-[#1d4e89]">
                            {candidate.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold">{candidate.name}</p>
                            <p className="truncate text-[11px] text-[#667085]">{candidate.role}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone.badge}`}>
                          {candidate.label} · {candidate.score}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef2f6]">
                        <div
                          className={`landing-score-bar h-full rounded-full ${tone.bar}`}
                          style={{ '--bar-width': `${candidate.score}%`, '--bar-delay': `${450 + index * 180}ms` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg border border-[#4e5ba6]/25 bg-[#4e5ba6]/[0.06] p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4e5ba6]">Phân tích AI</p>
                <p className="mt-1 text-[12px] leading-5 text-[#475467]">
                  Trần Thùy Linh đáp ứng 6/7 kỹ năng bắt buộc, 5 năm kinh nghiệm phù hợp. Cần xác minh thêm kinh
                  nghiệm triển khai hệ thống lớn khi phỏng vấn.
                </p>
              </div>

              {/* Nhật ký hoạt động tuyển dụng — luân phiên liên tục */}
              <div className="landing-ticker mt-3 text-[11px] font-medium text-[#667085]">
                <span style={{ '--tick-delay': '0s' } as React.CSSProperties} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1d4e89]" /> Đã nhận thêm 2 CV mới cho vị trí Backend Developer…
                </span>
                <span style={{ '--tick-delay': '3s' } as React.CSSProperties} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4e5ba6]" /> AI đang đối chiếu kỹ năng với yêu cầu công việc…
                </span>
                <span style={{ '--tick-delay': '6s' } as React.CSSProperties} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17915f]" /> Đã cập nhật bảng xếp hạng — 3 ứng viên nổi bật.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Đối tác */}
      <section className="border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
          <p className="landing-reveal text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
            Đối tác đồng hành và hỗ trợ
          </p>
          <div className="landing-reveal mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {PARTNERS.map((partner) => (
              <img
                key={partner.name}
                src={partner.logo}
                alt={`Logo ${partner.name}`}
                className="opacity-80 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0"
                // Inline style vì global.css có rule `img { height: auto }` đè utility class.
                style={{ height: 44, width: 'auto', maxWidth: 130, objectFit: 'contain' }}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {VALUE_STRIP.map((item, index) => (
            <div key={item.label} className="landing-reveal flex items-start gap-3" style={{ '--reveal-delay': `${index * 70}ms` } as React.CSSProperties}>
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d4e89]/[0.08] text-[#1d4e89]">
                <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[14px] font-semibold">{item.label}</p>
                <p className="mt-0.5 text-[12px] leading-5 text-[#667085]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="landing-reveal max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">Vấn đề quen thuộc</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em]">
            Sàng lọc thủ công đang làm chậm cả đội tuyển dụng
          </h2>
          <p className="mt-3 text-[14px] leading-6 text-[#475467]">
            Và đây là cách SupportHR giải quyết từng vấn đề một.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PROBLEM_SOLUTIONS.map((item, index) => (
            <div
              key={item.problem}
              className="landing-reveal landing-card-hover rounded-xl border border-[#e4e7ec] bg-white p-5"
              style={{ '--reveal-delay': `${(index % 2) * 80}ms` } as React.CSSProperties}
            >
              <p className="text-[14px] font-medium leading-6 text-[#172033]">{item.problem}</p>
              <div className="mt-3 flex items-start gap-2 border-t border-[#eaecf0] pt-3">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#17915f]" aria-hidden="true" />
                <p className="text-[13px] leading-6 text-[#475467]">{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* So sánh cơ chế hoạt động */}
      <section id="so-sanh" className="border-y border-[#e4e7ec] bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="landing-reveal max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">So sánh cơ chế hoạt động</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em]">Sàng lọc thủ công và SupportHR khác nhau thế nào?</h2>
          </div>
          <div className="landing-reveal mt-8 overflow-x-auto rounded-xl border border-[#e4e7ec] bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e4e7ec] bg-[#f8fafc] text-[13px]">
                  <th className="px-5 py-4 font-semibold text-[#667085]">Tiêu chí</th>
                  <th className="px-5 py-4 font-semibold text-[#667085]">
                    <span className="inline-flex items-center gap-2">
                      <X className="h-4 w-4 text-[#d92d20]" aria-hidden="true" />
                      Cách làm thủ công
                    </span>
                  </th>
                  <th className="bg-[#1d4e89]/[0.04] px-5 py-4 font-semibold text-[#1d4e89]">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Với SupportHR
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-[#eaecf0] text-[13px] last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-[#172033]">{row.label}</td>
                    <td className="px-5 py-4 leading-6 text-[#667085]">{row.manual}</td>
                    <td className="bg-[#1d4e89]/[0.04] px-5 py-4 font-medium leading-6 text-[#344054]">{row.supporthr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="tinh-nang" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="landing-reveal max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">Tính năng chính</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em]">Mọi công cụ cho quy trình sàng lọc hiện đại</h2>
          <p className="mt-3 text-[14px] leading-6 text-[#475467]">
            Từ chuẩn hóa JD đến gửi thông báo kết quả — sáu nhóm tính năng phủ trọn vòng sàng lọc ứng viên.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="landing-reveal landing-card-hover rounded-xl border border-[#e4e7ec] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
              style={{ '--reveal-delay': `${(index % 3) * 80}ms` } as React.CSSProperties}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d4e89]/[0.08] text-[#1d4e89]">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[16px] font-semibold leading-6">{feature.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#475467]">{feature.description}</p>
              <ul className="mt-4 space-y-2">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-[13px] text-[#475467]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#17915f]" aria-hidden="true" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow + ảnh sản phẩm thật */}
      <section id="cach-hoat-dong" className="border-y border-[#e4e7ec] bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="landing-reveal max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">Quy trình làm việc</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em]">Bốn bước từ JD đến quyết định tuyển dụng</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <div
                key={step.title}
                className="landing-reveal landing-step-card relative rounded-xl border border-[#e4e7ec] bg-white p-5"
                style={{ '--reveal-delay': `${index * 90}ms`, '--step-delay': `${index * 2}s` } as React.CSSProperties}
              >
                {index < HOW_IT_WORKS.length - 1 && (
                  <span
                    className="landing-flow-line absolute -right-4 top-10 hidden w-4 lg:block"
                    style={{ '--flow-delay': `${index * 2 + 1.2}s` } as React.CSSProperties}
                    aria-hidden="true"
                  />
                )}
                <div className="flex items-center justify-between">
                  <span className="landing-step-icon inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d4e89]/[0.08] text-[#1d4e89]">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-[30px] font-bold leading-none text-[#e4e7ec]">{index + 1}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-5 text-[#475467]">{step.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Bộ công cụ */}
      <section id="cong-cu" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="landing-reveal max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">Bộ công cụ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em]">9 công cụ trong một không gian làm việc</h2>
          <p className="mt-3 text-[14px] leading-6 text-[#475467]">
            Đúng những gì bạn thấy trên thanh điều hướng của SupportHR — không hứa hẹn tính năng chưa tồn tại.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, index) => (
            <div
              key={tool.name}
              className="landing-reveal landing-card-hover flex items-start gap-3.5 rounded-xl border border-[#e4e7ec] bg-white p-4"
              style={{ '--reveal-delay': `${(index % 3) * 70}ms` } as React.CSSProperties}
            >
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1d4e89]/[0.08] text-[#1d4e89]">
                <tool.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[14px] font-semibold">{tool.name}</p>
                <p className="mt-1 text-[12px] leading-5 text-[#667085]">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ứng dụng di động Hipo Tools — nhận diện theo app thật: nền sáng, accent vàng cam */}
      <section id="mobile-app" className="border-y border-[#f3d9a4] bg-[#fffaf0]">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div className="landing-reveal">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e9a23b]/40 bg-[#e9a23b]/10 px-3 py-1 text-[12px] font-medium text-[#b45309]">
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              Ứng dụng di động Android
            </p>
            <div className="mt-4 flex items-center gap-3">
              <img
                src="/images/mobile/hipo-icon.png"
                alt="Logo Hipo Tools"
                className="rounded-xl border border-[#eaecf0] bg-white"
                // Inline style vì global.css có rule `img { height: auto }` đè utility class.
                style={{ width: 52, height: 52, objectFit: 'cover' }}
              />
              <h2 className="text-3xl font-bold tracking-[-0.02em] text-[#172033]">
                Hipo Tools — SupportHR trong túi của bạn
              </h2>
            </div>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#475467]">
              Ứng dụng đồng hành trên điện thoại: theo dõi kết quả phân tích, nhận thông báo và thao tác nhanh
              với hồ sơ ứng viên khi bạn không ngồi trước máy tính. Dữ liệu đồng bộ với tài khoản SupportHR trên web.
            </p>
            <ul className="mt-6 space-y-3">
              {MOBILE_FEATURES.map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-[14px] leading-6 text-[#344054]">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e9a23b]/15 text-[#b45309]">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('/app-docs')}
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1d4e89] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#163a5f]"
            >
              Tìm hiểu cách cài đặt
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Khung điện thoại với ảnh chụp màn hình thật của app (nền đen theo adaptive icon) */}
          <div aria-hidden="true" className="landing-reveal flex justify-center" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            <div className="w-[250px] rounded-[2.1rem] border-[7px] border-[#101828] bg-[#101828] shadow-[0_24px_60px_rgba(16,24,40,0.3)] sm:w-[270px]">
              <div className="overflow-hidden rounded-[1.7rem] bg-white">
                <img
                  src="/images/mobile/hipo-home.png"
                  alt="Màn hình Tổng quan tuyển dụng của ứng dụng Hipo Tools"
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Khách hàng nói gì */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="landing-reveal max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1d4e89]">Khách hàng nói gì</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em]">Đội tuyển dụng dùng SupportHR mỗi ngày</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <figure
              key={item.author + item.context}
              className="landing-reveal landing-card-hover flex flex-col rounded-xl border border-[#e4e7ec] bg-white p-6"
              style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties}
            >
              <Quote className="h-6 w-6 text-[#1d4e89]/30" aria-hidden="true" />
              <blockquote className="mt-3 flex-1 text-[14px] leading-7 text-[#344054]">“{item.quote}”</blockquote>
              <figcaption className="mt-5 border-t border-[#eaecf0] pt-4">
                <p className="text-[13px] font-semibold text-[#172033]">{item.author}</p>
                <p className="mt-0.5 text-[12px] text-[#667085]">{item.context}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="landing-reveal rounded-2xl bg-[#1d4e89] px-6 py-12 text-center sm:px-12">
          <BarChart3 className="mx-auto h-8 w-8 text-white/70" aria-hidden="true" />
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] text-white">
            Bắt đầu xây dựng quy trình tuyển dụng hiệu quả hơn
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-6 text-white/80">
            Tạo phiên sàng lọc đầu tiên trong vài phút — nạp JD, tải CV và nhận phân tích có giải thích ngay.
          </p>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-[10px] bg-white px-7 text-[15px] font-semibold text-[#1d4e89] transition-all hover:bg-[#eef2f6] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
          >
            {isLoggedIn ? 'Vào không gian làm việc' : 'Trải nghiệm SupportHR'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e4e7ec] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandLogo size={30} />
              <span className="text-[16px] font-semibold">SupportHR</span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-6 text-[#667085]">
              Nền tảng tuyển dụng thông minh: phân tích CV bằng AI, đánh giá minh bạch, hỗ trợ nhà tuyển dụng ra
              quyết định nhanh và công bằng hơn.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">Sản phẩm</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#475467]">
              <li><button type="button" onClick={() => goTo('#tinh-nang')} className="hover:text-[#172033]">Tính năng</button></li>
              <li><button type="button" onClick={() => goTo('#cong-cu')} className="hover:text-[#172033]">Bộ công cụ</button></li>
              <li><button type="button" onClick={() => goTo('#mobile-app')} className="hover:text-[#172033]">Ứng dụng Hipo Tools</button></li>
              <li><button type="button" onClick={() => navigate('/pricing')} className="hover:text-[#172033]">Bảng giá</button></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">Tài nguyên</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#475467]">
              <li><button type="button" onClick={() => navigate('/app-docs')} className="hover:text-[#172033]">Tài liệu hướng dẫn</button></li>
              <li><button type="button" onClick={() => navigate('/ai-methodology')} className="hover:text-[#172033]">Phương pháp AI</button></li>
              <li><button type="button" onClick={() => navigate('/faq')} className="hover:text-[#172033]">Câu hỏi thường gặp</button></li>
              <li><button type="button" onClick={() => navigate('/book-demo')} className="hover:text-[#172033]">Đặt lịch demo</button></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#98a2b3]">Pháp lý & bảo mật</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#475467]">
              <li><button type="button" onClick={() => navigate('/security')} className="hover:text-[#172033]">Bảo mật</button></li>
              <li><button type="button" onClick={() => navigate('/privacy-policy')} className="hover:text-[#172033]">Chính sách quyền riêng tư</button></li>
              <li><button type="button" onClick={() => navigate('/terms')} className="hover:text-[#172033]">Điều khoản dịch vụ</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#eaecf0]">
          <p className="mx-auto w-full max-w-7xl px-4 py-5 text-[12px] text-[#98a2b3] sm:px-6">
            © {new Date().getFullYear()} SupportHR. Phân tích AI chỉ mang tính hỗ trợ — quyết định tuyển dụng cuối cùng thuộc về nhà tuyển dụng.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
