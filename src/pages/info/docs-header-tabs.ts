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

export interface DocsMenuGroup {
  label: string;
  items: DocsHeaderTab[];
}

export const productDocsMenus: DocsMenuGroup[] = [
  {
    label: "Sản phẩm",
    items: [
      { label: "Tổng quan", to: "/app-docs" },
      { label: "Quy trình sàng lọc", to: "/process" },
      { label: "Phương pháp đánh giá", to: "/ai-methodology" },
      { label: "Tình huống sử dụng", to: "/use-cases" },
      { label: "Tích hợp", to: "/integrations" },
    ],
  },
  {
    label: "Tài liệu",
    items: [
      { label: "Hướng dẫn sử dụng", to: "/guide", matchPaths: ["/guide", "/demo"] },
      { label: "Bảo mật dữ liệu", to: "/security" },
      { label: "Câu hỏi thường gặp", to: "/faq" },
      { label: "Bảng giá & triển khai", to: "/pricing" },
      { label: "Chính sách bảo mật", to: "/privacy-policy" },
      { label: "Điều khoản", to: "/terms" },
    ],
  },
];

export const productDocsTabs = productDocsMenus.flatMap((group) => group.items);

export const productDocsSearchEntries: DocsSearchEntry[] = [
  {
    label: "Tổng quan Support HR",
    to: "/app-docs",
    description: "Khả năng chính và cách Support HR hỗ trợ đội tuyển dụng.",
    keywords: ["tổng quan", "sản phẩm", "support hr", "tính năng"],
  },
  {
    label: "Quy trình sàng lọc",
    to: "/process",
    description: "Quy trình từ JD và CV đến danh sách ứng viên đề xuất.",
    keywords: ["quy trình", "workflow", "jd", "cv", "sàng lọc"],
  },
  {
    label: "Phương pháp đánh giá",
    to: "/ai-methodology",
    description: "Cách trích tiêu chí, chấm điểm và giải thích kết quả.",
    keywords: ["đánh giá", "phương pháp", "điểm", "giải thích", "ai"],
  },
  {
    label: "Tình huống sử dụng",
    to: "/use-cases",
    description: "Các tình huống tuyển dụng phù hợp với Support HR.",
    keywords: ["tình huống", "use case", "shortlist", "tuyển dụng"],
  },
  {
    label: "Tích hợp",
    to: "/integrations",
    description: "Google Drive, tải file trực tiếp và khả năng mở rộng.",
    keywords: ["tích hợp", "google drive", "upload", "ats", "hris"],
  },
  {
    label: "Hướng dẫn sử dụng",
    to: "/guide",
    description: "Hướng dẫn sử dụng sản phẩm theo từng bước.",
    keywords: ["hướng dẫn", "cách dùng", "demo", "bắt đầu"],
  },
  {
    label: "Bảo mật dữ liệu",
    to: "/security",
    description: "Cách Support HR xử lý, lưu trữ và bảo vệ dữ liệu.",
    keywords: ["bảo mật", "dữ liệu", "lưu trữ", "quyền truy cập"],
  },
  {
    label: "Câu hỏi thường gặp",
    to: "/faq",
    description: "Giải đáp nhanh về sản phẩm, dữ liệu và triển khai.",
    keywords: ["faq", "câu hỏi", "hỏi đáp", "hỗ trợ"],
  },
  {
    label: "Bảng giá & triển khai",
    to: "/pricing",
    description: "Phạm vi gói dịch vụ và thông tin triển khai.",
    keywords: ["bảng giá", "chi phí", "gói", "triển khai"],
  },
  {
    label: "Chính sách bảo mật",
    to: "/privacy-policy",
    description: "Chính sách quyền riêng tư và xử lý dữ liệu người dùng.",
    keywords: ["chính sách", "quyền riêng tư", "privacy", "dữ liệu"],
  },
  {
    label: "Điều khoản sử dụng",
    to: "/terms",
    description: "Điều khoản và trách nhiệm khi sử dụng Support HR.",
    keywords: ["điều khoản", "terms", "trách nhiệm", "dịch vụ"],
  },
];
