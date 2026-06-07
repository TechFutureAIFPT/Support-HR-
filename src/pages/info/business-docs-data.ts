import type { LegalTone } from "./legal-ui";

export type BillingMode = "monthly" | "yearly";

export interface PricingPlanModeContent {
  cycle: string;
  commercialLabel: string;
  serviceNote: string;
}

export interface PricingPlan {
  name: string;
  audience: string;
  price: string;
  capacity: string;
  tone: LegalTone;
  summary: string;
  highlightLabel: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaSecondaryLabel: string;
  comparisonKey: "starter" | "growth" | "enterprise";
  billingModes: Record<BillingMode, PricingPlanModeContent>;
}

export interface PricingComparisonRow {
  label: string;
  description: string;
  values: Record<PricingPlan["comparisonKey"], string>;
}

export interface PricingFaqItem {
  question: string;
  answer: string;
}

export interface DocsNavItem {
  id: string;
  title: string;
}

export interface DocsNavGroup {
  id: "pricing" | "security" | "faq";
  label: string;
  description: string;
  icon: string;
  tone: LegalTone;
  items: DocsNavItem[];
}

export interface TrustHighlight {
  key: string;
  eyebrow: string;
  title: string;
  detail: string;
  iconClass: string;
}

export interface DocsTrustMetric {
  value: string;
  label: string;
  detail: string;
  tone: LegalTone;
}

export interface DocsReadinessItem {
  label: string;
  status: "ready" | "need-input";
  detail: string;
}

export interface SecurityDocSection {
  id: string;
  title: string;
  description: string;
  tone: LegalTone;
  icon: string;
  bullets: string[];
  note?: string;
}

export interface FAQGuideSection {
  id: string;
  title: string;
  description: string;
  tone: LegalTone;
  icon: string;
  bullets: string[];
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Khởi đầu",
    audience: "Nhóm tuyển dụng nhỏ",
    price: "Liên hệ",
    capacity: "Đến 300 CV / tháng",
    tone: "cyan",
    summary:
      "Dành cho đội ngũ cần một luồng sàng lọc gọn, nhanh và dễ thử nghiệm ngay với một vài vị trí trọng tâm.",
    highlightLabel: "Dễ bắt đầu",
    features: [
      "Nhập CV từ tải file lên và Google Drive",
      "OCR cho tài liệu scan và file ảnh",
      "Chấm điểm theo JD và shortlist có giải thích",
      "Lưu lịch sử phiên để xem lại",
    ],
    ctaLabel: "Đặt lịch demo",
    ctaHref: "/book-demo",
    ctaSecondaryLabel: "Trao đổi nhu cầu",
    comparisonKey: "starter",
    billingModes: {
      monthly: {
        cycle: "Theo tháng",
        commercialLabel: "Cam kết linh hoạt",
        serviceNote:
          "Phù hợp khi đội ngũ muốn thử luồng thật với chi phí vận hành dễ kiểm soát.",
      },
      yearly: {
        cycle: "Theo năm",
        commercialLabel: "Ưu tiên khởi động",
        serviceNote:
          "Phù hợp khi doanh nghiệp muốn chốt sớm bộ khung làm việc và lịch triển khai ban đầu.",
      },
    },
  },
  {
    name: "Mở rộng",
    audience: "Phòng HR đang mở rộng",
    price: "Liên hệ",
    capacity: "Đến 1.500 CV / tháng",
    tone: "emerald",
    summary:
      "Phù hợp cho doanh nghiệp cần xử lý nhiều vị trí, nhiều recruiter và cần phối hợp đánh giá rõ ràng hơn.",
    highlightLabel: "Đề xuất",
    features: [
      "Quản lý nhiều phiên sàng lọc song song",
      "Bộ câu hỏi phỏng vấn theo danh sách đề cử",
      "Bộ tiêu chí và trọng số theo từng vị trí",
      "Báo cáo để chia sẻ cho quản lý tuyển dụng",
    ],
    ctaLabel: "Xem đề xuất triển khai",
    ctaHref: "/book-demo",
    ctaSecondaryLabel: "Xem chi tiết tài liệu",
    comparisonKey: "growth",
    billingModes: {
      monthly: {
        cycle: "Theo tháng",
        commercialLabel: "Vận hành tăng trưởng",
        serviceNote:
          "Giữ nhịp mở rộng tuyển dụng mà chưa cần chốt ràng buộc triển khai dài hạn ngay từ đầu.",
      },
      yearly: {
        cycle: "Theo năm",
        commercialLabel: "Ưu tiên mở rộng",
        serviceNote:
          "Tối ưu cho doanh nghiệp đã rõ quy mô tuyển dụng và muốn lên kế hoạch onboarding theo quý.",
      },
    },
  },
  {
    name: "Doanh nghiệp",
    audience: "Doanh nghiệp có yêu cầu kiểm soát",
    price: "Báo giá riêng",
    capacity: "Từ 1.500+ CV / tháng",
    tone: "violet",
    summary:
      "Dành cho tổ chức cần hỗ trợ triển khai, kiểm soát vận hành, tài liệu niềm tin và lộ trình tích hợp rõ ràng.",
    highlightLabel: "Enterprise",
    features: [
      "Tư vấn quy trình theo phòng ban",
      "Tài liệu bảo mật, lưu trữ và quy trình rà soát",
      "Hỗ trợ triển khai và đào tạo đội ngũ",
      "Kế hoạch mở rộng tính năng và tích hợp",
    ],
    ctaLabel: "Liên hệ tư vấn",
    ctaHref: "/book-demo",
    ctaSecondaryLabel: "Trao đổi với sales",
    comparisonKey: "enterprise",
    billingModes: {
      monthly: {
        cycle: "Theo tháng",
        commercialLabel: "Khung linh hoạt cao",
        serviceNote:
          "Dành cho tổ chức cần cấu trúc thương mại tùy biến theo tình hình vận hành thực tế.",
      },
      yearly: {
        cycle: "Theo năm",
        commercialLabel: "Ưu tiên triển khai sâu",
        serviceNote:
          "Phù hợp khi cần lịch rollout, đào tạo và đồng bộ chính sách theo lộ trình dài hơn.",
      },
    },
  },
];

export const pricingComparisonRows: PricingComparisonRow[] = [
  {
    label: "Dung lượng xử lý",
    description:
      "Quy mô CV gợi ý để đội ngũ vận hành ổn định trong một chu kỳ tuyển dụng điển hình.",
    values: {
      starter: "Đến 300 CV / tháng",
      growth: "Đến 1.500 CV / tháng",
      enterprise: "Từ 1.500+ CV / tháng",
    },
  },
  {
    label: "Nguồn nhập CV",
    description: "Các kênh nhập liệu dùng ngay trong flow hiện tại.",
    values: {
      starter: "Upload + Google Drive",
      growth: "Upload + Google Drive",
      enterprise: "Upload + Google Drive + nhu cầu tích hợp thêm",
    },
  },
  {
    label: "Số phiên song song",
    description: "Khả năng vận hành nhiều chiến dịch sàng lọc trong cùng giai đoạn.",
    values: {
      starter: "1-2 vị trí trọng tâm",
      growth: "Nhiều vị trí song song",
      enterprise: "Theo mô hình phòng ban",
    },
  },
  {
    label: "Khung tiêu chí",
    description: "Mức độ tùy chỉnh bộ tiêu chí và trọng số theo từng vai trò.",
    values: {
      starter: "Cấu hình cơ bản",
      growth: "Theo từng vị trí",
      enterprise: "Theo phòng ban và quy trình nội bộ",
    },
  },
  {
    label: "Báo cáo chia sẻ",
    description: "Thông tin đầu ra dành cho recruiter và quản lý tuyển dụng.",
    values: {
      starter: "Shortlist có giải thích",
      growth: "Shortlist + báo cáo chia sẻ",
      enterprise: "Báo cáo + tài liệu rà soát mở rộng",
    },
  },
  {
    label: "Hỗ trợ triển khai",
    description: "Mức đồng hành khi đưa quy trình vào dùng thật.",
    values: {
      starter: "Buổi kickoff ngắn",
      growth: "Kickoff + rà soát phiên đầu",
      enterprise: "Triển khai theo kế hoạch riêng",
    },
  },
];

export const pricingFaqs: PricingFaqItem[] = [
  {
    question: "Nếu chưa chốt gói ngay, đội ngũ có thể bắt đầu từ đâu?",
    answer:
      "Cách nhanh nhất là đặt một buổi demo theo đúng flow tuyển dụng hiện tại, sau đó đối chiếu quy mô CV, số recruiter và mức độ kiểm soát để chốt gói phù hợp.",
  },
  {
    question: "Toggle theo tháng và theo năm có thay đổi giá niêm yết không?",
    answer:
      "Không. Support HR đang đi theo mô hình contact-led, nên toggle chỉ giúp đội ngũ hình dung cách cam kết thương mại và mức ưu tiên triển khai phù hợp.",
  },
  {
    question: "Khi nào nên đi thẳng lên gói Doanh nghiệp?",
    answer:
      "Khi tổ chức cần lịch rollout rõ, tài liệu niềm tin để làm việc với bộ phận mua sắm hoặc CNTT, và mong muốn khung hỗ trợ triển khai sâu hơn tiêu chuẩn.",
  },
  {
    question: "Có thể đổi gói sau khi bắt đầu không?",
    answer:
      "Có. Cấu trúc thương mại được chốt theo giai đoạn vận hành, nên doanh nghiệp có thể nâng mức hỗ trợ hoặc mở rộng phạm vi khi quy mô tuyển dụng tăng lên.",
  },
];

export const pricingHeroHighlights = [
  "Lấy JD làm trung tâm để chấm điểm và đề cử có lý do",
  "Đi từ demo thử nhanh sang rollout có kiểm soát mà không đổi luồng làm việc",
  "Giữ ngôn ngữ thương mại rõ ràng cho recruiter, quản lý tuyển dụng và bộ phận mua sắm",
];

export const docsTrustMetrics: DocsTrustMetric[] = [
  {
    value: "4",
    label: "trang tài liệu chính",
    detail: "Đội ngũ, bảo mật, cách sử dụng và bảng giá được tách riêng để bên mua tra cứu nhanh.",
    tone: "cyan",
  },
  {
    value: "11",
    label: "anchor nội dung",
    detail: "Người xem có thể đi thẳng tới bảng giá, kiểm soát truy cập, dữ liệu Drive hoặc FAQ.",
    tone: "emerald",
  },
  {
    value: "3",
    label: "nhóm câu hỏi mua sắm",
    detail: "Thương mại, bảo mật và vận hành được gom thành các khối dễ dùng trong buổi demo.",
    tone: "violet",
  },
];

export const docsReadinessItems: DocsReadinessItem[] = [
  {
    label: "SSL/TLS và tên miền",
    status: "ready",
    detail: "Có thể trình bày như tín hiệu truy cập an toàn cơ bản cho website.",
  },
  {
    label: "Quy trình Google Drive",
    status: "ready",
    detail: "Đã có mô tả phạm vi đọc file theo hành động chọn của người dùng.",
  },
  {
    label: "Chính sách lưu trữ CV",
    status: "need-input",
    detail: "Cần chốt thời gian lưu, nơi lưu và cách xóa dữ liệu theo yêu cầu.",
  },
  {
    label: "DPA, SLA hoặc tài liệu pháp lý",
    status: "need-input",
    detail: "Cần thông tin chính thức nếu muốn bán cho doanh nghiệp hoặc trường hợp mua sắm nghiêm ngặt.",
  },
];

export const docsNavigation: DocsNavGroup[] = [
  {
    id: "pricing",
    label: "Bảng giá",
    description: "Phạm vi gói, nhịp thương mại và cách đọc đề xuất triển khai.",
    icon: "fa-tags",
    tone: "cyan",
    items: [
      { id: "pricing-overview", title: "Tổng quan thương mại" },
      { id: "pricing-plans", title: "Ba gói triển khai" },
      { id: "pricing-comparison", title: "Bảng so sánh nhanh" },
      { id: "pricing-commercial", title: "Câu hỏi thương mại" },
    ],
  },
  {
    id: "security",
    label: "Bảo mật",
    description: "Cách Support HR xử lý truy cập, file tuyển dụng và tín hiệu niềm tin.",
    icon: "fa-shield-halved",
    tone: "emerald",
    items: [
      { id: "security-overview", title: "Khung niềm tin" },
      { id: "security-controls", title: "Kiểm soát truy cập" },
      { id: "security-drive", title: "Google Drive và dữ liệu" },
      { id: "security-operations", title: "Vận hành và hỗ trợ" },
    ],
  },
  {
    id: "faq",
    label: "Hỏi đáp",
    description: "Những câu hỏi ngắn gọn mà bên mua thường cần trước khi đặt lịch.",
    icon: "fa-circle-question",
    tone: "violet",
    items: [
      { id: "faq-fit", title: "Phù hợp với đội ngũ nào" },
      { id: "faq-data", title: "CV và dữ liệu" },
      { id: "faq-ai", title: "AI hỗ trợ thế nào" },
      { id: "faq-setup", title: "Khởi động sử dụng" },
    ],
  },
];

export const securityTrustHighlights: TrustHighlight[] = [
  {
    key: "ssl",
    eyebrow: "Kết nối an toàn",
    title: "SSL/TLS đang hoạt động",
    detail:
      "Chứng chỉ được cấp qua Let's Encrypt để bảo vệ luồng truy cập giữa trình duyệt và hệ thống.",
    iconClass: "fa-solid fa-lock",
  },
  {
    key: "oauth",
    eyebrow: "Tài khoản Google",
    title: "OAuth Consent Screen Verification",
    detail:
      "Quyền truy cập Google Drive đi qua màn hình xin quyền và quy trình xác minh ứng dụng.",
    iconClass: "fa-brands fa-google",
  },
];

export const securityDocSections: SecurityDocSection[] = [
  {
    id: "security-controls",
    title: "Kiểm soát truy cập và phiên làm việc",
    description:
      "Support HR được thiết kế để đội tuyển dụng đi nhanh hơn nhưng vẫn giữ được khả năng theo dõi ngữ cảnh và quyền truy cập theo người dùng.",
    tone: "cyan",
    icon: "fa-user-lock",
    bullets: [
      "Trạng thái làm việc gắn với người dùng đã đăng nhập",
      "Thông tin xác thực dịch vụ ngoài được xử lý phía máy chủ",
      "Có thể truy vết ngữ cảnh chấm điểm và đề cử trong cùng một phiên",
    ],
    note:
      "Nhóm recruiter truy cập theo luồng mình vận hành, còn admin là nơi điều phối triển khai và chính sách ở mức đội ngũ.",
  },
  {
    id: "security-drive",
    title: "Google Drive và phạm vi dữ liệu",
    description:
      "Google Drive được dùng ở mức tối thiểu cần thiết để người dùng đã đăng nhập duyệt, chọn và nhập tài liệu tuyển dụng vào quy trình sàng lọc.",
    tone: "emerald",
    icon: "fa-folder-open",
    bullets: [
      "Chỉ đọc metadata và nội dung của những file người dùng chủ động chọn",
      "Không quét rộng toàn bộ Drive nếu người dùng không yêu cầu",
      "Không âm thầm đồng bộ các thư mục không liên quan đến phiên làm việc",
    ],
    note:
      "Mục tiêu là giữ tài liệu tuyển dụng nằm trong cùng một flow vận hành mà không mở rộng quyền vượt quá nhu cầu thực tế.",
  },
  {
    id: "security-operations",
    title: "Lưu trữ, xóa và hỗ trợ vận hành",
    description:
      "Lịch sử phiên được giữ để recruiter có thể rà soát, bàn giao và xem lại quyết định gần đây, đồng thời vẫn có đường hỗ trợ khi cần dọn dữ liệu hoặc mở rộng tài liệu niềm tin.",
    tone: "sky",
    icon: "fa-clock-rotate-left",
    bullets: [
      "Đội ngũ có thể đặt thời gian lưu phù hợp với chính sách nội bộ",
      "Yêu cầu dọn dữ liệu được thực hiện theo quy trình vận hành đã thống nhất",
      "Có hỗ trợ triển khai, tiếp nhận lỗi và bổ sung tài liệu cho bước mua sắm sâu hơn",
    ],
    note:
      "Nếu doanh nghiệp cần DPA, SLA hoặc bảng câu hỏi bảo mật riêng, đây là phần nối tiếp tự nhiên sau buổi đánh giá ban đầu.",
  },
];

export const faqGuideSections: FAQGuideSection[] = [
  {
    id: "faq-fit",
    title: "Support HR phù hợp với kiểu đội ngũ nào?",
    description:
      "Phù hợp với đội tuyển dụng cần một nơi để nhập CV, đối chiếu với JD và chia sẻ shortlist có thể rà soát cho các bên liên quan.",
    tone: "cyan",
    icon: "fa-users",
    bullets: [
      "Sàng lọc cho một vị trí đang mở",
      "Khối lượng CV lớn cho một recruiter hoặc một nhóm nhỏ",
      "Rà soát chung giữa chuyên viên tuyển dụng và quản lý tuyển dụng",
    ],
  },
  {
    id: "faq-data",
    title: "CV và dữ liệu ứng viên được xử lý ra sao?",
    description:
      "Đội ngũ có thể làm việc từ file tải lên và nội dung Google Drive đã kết nối, giúp giữ tài liệu tuyển dụng trong cùng một luồng vận hành.",
    tone: "emerald",
    icon: "fa-file-lines",
    bullets: [
      "Dùng đúng các file và ngữ cảnh tài khoản cần cho quy trình sàng lọc",
      "Không tự mở các thư mục hay nguồn dữ liệu không liên quan ở nền",
      "Có thể xem lại lịch sử phiên để giữ mạch bàn giao",
    ],
  },
  {
    id: "faq-ai",
    title: "AI hỗ trợ thế nào trong quyết định tuyển dụng?",
    description:
      "AI không thay recruiter. Mục tiêu là tăng tốc bước trích xuất, đối chiếu và chuẩn bị shortlist, trong khi quyết định cuối cùng vẫn nằm ở đội ngũ.",
    tone: "sky",
    icon: "fa-brain",
    bullets: [
      "Điểm số là một lớp xếp hạng vòng đầu có cấu trúc",
      "Đề cử được dùng như gợi ý để con người rà soát sâu hơn",
      "JD được dùng làm chuẩn để giữ cách đối chiếu nhất quán",
    ],
  },
  {
    id: "faq-setup",
    title: "Khởi động sử dụng nên bắt đầu thế nào?",
    description:
      "Một giai đoạn khởi động tốt thường bắt đầu bằng vị trí mục tiêu, JD mẫu và một bộ CV thật để đội ngũ nhìn thấy flow hoàn chỉnh ngay từ đầu.",
    tone: "violet",
    icon: "fa-rocket",
    bullets: [
      "Chốt quy trình tuyển dụng và vị trí mục tiêu",
      "Kết nối tài khoản đội ngũ và Drive nếu cần",
      "Nạp JD mẫu và một bộ CV mẫu để rà soát cùng nhau",
    ],
  },
];

export const bookDemoChannels = [
  {
    label: "Hotline",
    value: "0899 280 108",
    href: "tel:0899280108",
    icon: "fa-phone",
  },
  {
    label: "Email",
    value: "support@supporthr.vn",
    href: "mailto:support@supporthr.vn",
    icon: "fa-envelope",
  },
  {
    label: "Phản hồi",
    value: "Trong 1 ngày làm việc",
    href: "mailto:support@supporthr.vn?subject=Dat%20lich%20demo%20Support%20HR",
    icon: "fa-clock",
  },
];
