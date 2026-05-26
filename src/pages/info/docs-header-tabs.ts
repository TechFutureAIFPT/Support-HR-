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
    description: "Luồng dùng sản phẩm từ JD đến shortlist",
    keywords: ["guide", "cách dùng", "cách sử dụng", "demo", "jd", "cv", "shortlist"],
  },
  {
    label: "Bảng giá",
    to: "/pricing",
    description: "Gói dịch vụ, thương mại và FAQ",
    keywords: ["pricing", "bảng giá", "gói", "chi phí", "faq", "thương mại"],
  },
];
