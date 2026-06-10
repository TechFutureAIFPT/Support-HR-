export interface DocsHeaderTab {
  label: string;
  to: string;
  matchPaths?: string[];
}

export interface DocsSearchEntry {
  label: string;
  to: string;
  description: string;
  keywords: string[];
}

export const productDocsTabs: DocsHeaderTab[] = [
  { label: "Đội ngũ", to: "/team", matchPaths: ["/team"] },
  { label: "Bảo mật dữ liệu", to: "/security", matchPaths: ["/security"] },
  { label: "Cách sử dụng", to: "/guide", matchPaths: ["/guide", "/demo"] },
  { label: "AI", to: "/ai-methodology", matchPaths: ["/ai-methodology"] },
  { label: "Tình huống sử dụng", to: "/use-cases", matchPaths: ["/use-cases"] },
  { label: "Tích hợp", to: "/integrations", matchPaths: ["/integrations"] },
  { label: "Bảng giá", to: "/pricing", matchPaths: ["/pricing"] },
];

export const productDocsSearchEntries: DocsSearchEntry[] = [
  {
    label: "Đội ngũ",
    to: "/team",
    description: "Giới thiệu đội ngũ, thành tích và liên hệ",
    keywords: ["team", "đội ngũ", "thành tích", "liên hệ", "member", "award"],
  },
  {
    label: "Bảo mật dữ liệu",
    to: "/security",
    description: "Chính sách bảo mật, lưu trữ và vận hành",
    keywords: ["security", "bảo mật", "dữ liệu", "lưu trữ", "compliance", "quyền truy cập"],
  },
  {
    label: "Cách sử dụng",
    to: "/guide",
    description: "Luồng dùng sản phẩm từ JD đến danh sách đề cử",
    keywords: ["guide", "cách dùng", "cách sử dụng", "demo", "jd", "cv", "shortlist"],
  },
  {
    label: "Bảng giá",
    to: "/pricing",
    description: "Gói dịch vụ, thương mại và hỏi đáp",
    keywords: ["pricing", "bảng giá", "gói", "chi phí", "faq", "thương mại"],
  },
  {
    label: "Phương pháp AI",
    to: "/ai-methodology",
    description: "Cách AI đọc JD, trích tiêu chí, chấm điểm và giải thích",
    keywords: ["ai", "methodology", "phương pháp", "chấm điểm", "giải thích", "jd"],
  },
  {
    label: "Tình huống sử dụng",
    to: "/use-cases",
    description: "Các tình huống vận hành phù hợp với Support HR",
    keywords: ["use case", "tình huống", "khối lượng lớn", "shortlist", "rà soát"],
  },
  {
    label: "Tích hợp",
    to: "/integrations",
    description: "Google Drive, upload trực tiếp và hướng mở rộng tích hợp",
    keywords: ["integration", "tích hợp", "google drive", "upload", "ats", "hris"],
  },
  {
    label: "Đặt lịch demo",
    to: "/book-demo",
    description: "Kênh liên hệ, agenda demo và kỳ vọng phản hồi",
    keywords: ["demo", "book demo", "đặt lịch", "hotline", "email", "liên hệ"],
  },
  {
    label: "Quy trình",
    to: "/process",
    description: "Quy trình 5 bước từ JD đến danh sách đề cử",
    keywords: ["process", "quy trình", "workflow", "jd", "cv", "shortlist"],
  },
  {
    label: "Sẵn sàng triển khai",
    to: "/contact-ready",
    description: "Kênh liên hệ và thông tin chuẩn bị triển khai",
    keywords: ["deployment", "triển khai", "contact", "liên hệ", "hotline"],
  },
  {
    label: "Chính sách bảo mật",
    to: "/privacy-policy",
    description: "Privacy policy, Google user data và quyền dữ liệu",
    keywords: ["privacy", "chính sách", "google user data", "dữ liệu", "bảo mật"],
  },
  {
    label: "Điều khoản",
    to: "/terms",
    description: "Điều khoản sử dụng dịch vụ",
    keywords: ["terms", "điều khoản", "sla", "trách nhiệm", "pháp lý"],
  },
];
