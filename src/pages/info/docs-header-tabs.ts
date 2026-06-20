export interface DocsHeaderTab {
  label: string;
  description: string;
  icon: string;
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
      { label: "Tổng quan Support HR", description: "Khả năng và phạm vi sản phẩm", icon: "fa-compass", to: "/app-docs" },
      { label: "Quy trình sàng lọc", description: "Từ JD đến danh sách đề xuất", icon: "fa-route", to: "/process" },
      { label: "Phương pháp đánh giá", description: "Tiêu chí, điểm số và bằng chứng", icon: "fa-scale-balanced", to: "/ai-methodology" },
      { label: "Tình huống sử dụng", description: "Các bài toán tuyển dụng phù hợp", icon: "fa-briefcase", to: "/use-cases" },
      { label: "Tích hợp", description: "Drive, tải file và đồng bộ", icon: "fa-plug", to: "/integrations" },
    ],
  },
  {
    label: "Tài liệu",
    items: [
      { label: "Hướng dẫn sử dụng", description: "Các bước trên Website và App mobile", icon: "fa-book-open", to: "/guide", matchPaths: ["/guide", "/demo"] },
      { label: "Kho lưu trữ CV", description: "Quản lý hồ sơ và lịch sử sàng lọc", icon: "fa-box-archive", to: "/docs/cv-library" },
      { label: "Mẫu JD", description: "Tạo và tái sử dụng mẫu tuyển dụng", icon: "fa-file-lines", to: "/docs/jd-templates" },
      { label: "Chuẩn hóa JD", description: "Kiểm tra và bổ sung nội dung JD", icon: "fa-wand-magic-sparkles", to: "/docs/jd-standardizer" },
      { label: "Bảo mật dữ liệu", description: "Cách dữ liệu tuyển dụng được bảo vệ", icon: "fa-shield-halved", to: "/security" },
      { label: "Câu hỏi thường gặp", description: "Giải đáp nhanh khi sử dụng", icon: "fa-circle-question", to: "/faq" },
    ],
  },
];

export const productDocsTabs = productDocsMenus.flatMap((group) => group.items);

export const productDocsSearchEntries: DocsSearchEntry[] = productDocsTabs.map((item) => ({
  label: item.label,
  to: item.to,
  description: item.description,
  keywords: [item.label.toLowerCase(), item.description.toLowerCase(), "support hr", "tài liệu"],
}));
