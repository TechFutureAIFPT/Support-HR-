export interface DocsHeaderTab {
  label: string;
  to: string;
  matchPaths?: string[];
}

export const productDocsTabs: DocsHeaderTab[] = [
  { label: "Đội ngũ", to: "/team", matchPaths: ["/team"] },
  { label: "Bảo mật dữ liệu", to: "/security", matchPaths: ["/security"] },
  { label: "Cách sử dụng", to: "/guide", matchPaths: ["/guide", "/demo"] },
  { label: "Bảng giá", to: "/pricing", matchPaths: ["/pricing"] },
];
