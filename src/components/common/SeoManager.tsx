import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.supporthr-tf.com.vn";
const SITE_NAME = "Support HR";
const DEFAULT_IMAGE = `${SITE_URL}/images/logos/logo.jpg`;

type RouteSeo = {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: string;
};

const DEFAULT_SEO: RouteSeo = {
  title: "Support HR - AI sàng lọc CV thông minh cho đội tuyển dụng",
  description:
    "Support HR hỗ trợ đội tuyển dụng sàng lọc CV, đối chiếu JD, chấm điểm ứng viên và chuẩn bị shortlist có thể rà soát.",
  canonicalPath: "/",
};

const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": DEFAULT_SEO,
  "/process": {
    title: "Quy trình sàng lọc CV thông minh | Support HR",
    description: "Luồng 5 bước từ JD, CV đầu vào đến shortlist có lý do để recruiter và hiring manager rà soát.",
  },
  "/contact-ready": {
    title: "Liên hệ triển khai Support HR",
    description: "Kênh liên hệ, tài liệu chuẩn bị và bước trao đổi triển khai Support HR cho doanh nghiệp.",
  },
  "/privacy-policy": {
    title: "Chính sách bảo mật và xử lý dữ liệu | Support HR",
    description: "Chính sách xử lý dữ liệu, Google user data, lưu trữ, bảo mật và quyền của chủ thể dữ liệu trong Support HR.",
  },
  "/terms": {
    title: "Điều khoản sử dụng dịch vụ | Support HR",
    description: "Điều khoản sử dụng Support HR, trách nhiệm, quyền sở hữu trí tuệ, AI disclaimer, SLA và giới hạn trách nhiệm.",
  },
  "/team": {
    title: "Đội ngũ TechFuture AI | Support HR",
    description: "Giới thiệu đội ngũ TechFuture AI, hành trình phát triển Support HR và các dấu mốc nổi bật.",
  },
  "/security": {
    title: "Security and data handling | Support HR",
    description: "Tài liệu bảo mật mô tả cách Support HR xử lý JD, CV, Google Drive và các điểm cần xác nhận với khách hàng doanh nghiệp.",
  },
  "/pricing": {
    title: "Bảng giá, bảo mật và FAQ | Support HR",
    description: "Tài liệu bảng giá, phạm vi gói, bảo mật và câu hỏi thường gặp trước khi đặt lịch demo Support HR.",
  },
  "/faq": {
    title: "FAQ Support HR",
    description: "Câu hỏi thường gặp về bảng giá, dữ liệu, bảo mật, AI và triển khai Support HR.",
    canonicalPath: "/pricing",
  },
  "/guide": {
    title: "Cách sử dụng Support HR",
    description: "Hướng dẫn đi từ JD, CV đầu vào đến điểm số, shortlist và bàn giao kết quả tuyển dụng trong Support HR.",
  },
  "/demo": {
    title: "Demo quy trình Support HR",
    description: "Luồng trải nghiệm sản phẩm Support HR từ nhập JD, nhập CV, chấm điểm đến shortlist có thể rà soát.",
    canonicalPath: "/guide",
  },
  "/ai-methodology": {
    title: "Phương pháp AI của Support HR",
    description: "Cách Support HR đọc JD, trích tiêu chí, chấm điểm ứng viên, giải thích kết quả và giữ con người trong vòng quyết định.",
  },
  "/use-cases": {
    title: "Use cases tuyển dụng | Support HR",
    description: "Các tình huống Support HR phù hợp: sàng lọc khối lượng lớn, vị trí chuyên môn và danh sách đề cử dễ rà soát.",
  },
  "/integrations": {
    title: "Tích hợp Google Drive và workflow | Support HR",
    description: "Tổng quan tích hợp Google Drive, upload trực tiếp, lịch sử phiên và hướng mở rộng ATS/HRIS của Support HR.",
  },
  "/book-demo": {
    title: "Đặt lịch demo Support HR",
    description: "Kênh liên hệ, nội dung buổi làm việc và kỳ vọng phản hồi khi đặt lịch demo Support HR.",
  },
  "/jd": {
    ...DEFAULT_SEO,
    robots: "noindex, nofollow",
  },
  "/weights": {
    ...DEFAULT_SEO,
    robots: "noindex, nofollow",
  },
  "/analysis": {
    ...DEFAULT_SEO,
    robots: "noindex, nofollow",
  },
  "/dashboard": {
    ...DEFAULT_SEO,
    robots: "noindex, nofollow",
  },
  "/detailed-analytics": {
    ...DEFAULT_SEO,
    robots: "noindex, nofollow",
  },
  "/chatbot": {
    ...DEFAULT_SEO,
    robots: "noindex, nofollow",
  },
  "/feedback": {
    ...DEFAULT_SEO,
    robots: "noindex, nofollow",
  },
};

function upsertMeta(selector: string, create: () => HTMLMetaElement, attr: "content", value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  element.setAttribute(attr, value);
}

function setNamedMeta(name: string, content: string) {
  upsertMeta(
    `meta[name="${name}"]`,
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      return meta;
    },
    "content",
    content
  );
}

function setPropertyMeta(property: string, content: string) {
  upsertMeta(
    `meta[property="${property}"]`,
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      return meta;
    },
    "content",
    content
  );
}

function setCanonical(href: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = href;
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const seo = ROUTE_SEO[location.pathname] ?? DEFAULT_SEO;
    const canonicalPath = seo.canonicalPath ?? location.pathname;
    const canonicalUrl = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
    const title = seo.title.includes(SITE_NAME) ? seo.title : `${seo.title} | ${SITE_NAME}`;
    const robots = seo.robots ?? "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

    document.title = title;
    setNamedMeta("title", title);
    setNamedMeta("description", seo.description);
    setNamedMeta("robots", robots);
    setNamedMeta("googlebot", robots);
    setNamedMeta("bingbot", robots);
    setCanonical(canonicalUrl);

    setPropertyMeta("og:type", "website");
    setPropertyMeta("og:site_name", SITE_NAME);
    setPropertyMeta("og:locale", "vi_VN");
    setPropertyMeta("og:url", canonicalUrl);
    setPropertyMeta("og:title", title);
    setPropertyMeta("og:description", seo.description);
    setPropertyMeta("og:image", DEFAULT_IMAGE);

    setPropertyMeta("twitter:card", "summary_large_image");
    setPropertyMeta("twitter:url", canonicalUrl);
    setPropertyMeta("twitter:title", title);
    setPropertyMeta("twitter:description", seo.description);
    setPropertyMeta("twitter:image", DEFAULT_IMAGE);
  }, [location.pathname]);

  return null;
}
