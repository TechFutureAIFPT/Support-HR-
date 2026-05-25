import type { LegalTone } from "./legal-ui";

export interface PricingPlan {
  name: string;
  audience: string;
  price: string;
  cycle: string;
  capacity: string;
  tone: LegalTone;
  summary: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Khởi đầu",
    audience: "Nhóm tuyển dụng nhỏ",
    price: "Liên hệ",
    cycle: "gói cơ bản",
    capacity: "Đến 300 CV / tháng",
    tone: "cyan",
    summary: "Dành cho đội ngũ cần một luồng sàng lọc gọn, nhanh và dễ thử nghiệm.",
    features: [
      "Nhập CV từ tải file lên và Google Drive",
      "OCR cho tài liệu scan",
      "Chấm điểm theo JD và shortlist có giải thích",
      "Lưu lịch sử phiên để xem lại",
    ],
    ctaLabel: "Đặt lịch demo",
    ctaHref: "/book-demo",
  },
  {
    name: "Mở rộng",
    audience: "Phòng HR đang mở rộng",
    price: "Liên hệ",
    cycle: "gói đề xuất",
    capacity: "Đến 1.500 CV / tháng",
    tone: "emerald",
    summary: "Phù hợp cho doanh nghiệp cần xử lý nhiều vị trí và nhiều chuyên viên tuyển dụng cùng lúc.",
    features: [
      "Quản lý nhiều phiên sàng lọc song song",
      "Bộ câu hỏi phỏng vấn theo danh sách đề cử",
      "Bộ tiêu chí và trọng số theo từng vị trí",
      "Báo cáo để chia sẻ cho quản lý tuyển dụng",
    ],
    ctaLabel: "Xem bảng giá chi tiết",
    ctaHref: "/pricing",
  },
  {
    name: "Doanh nghiệp",
    audience: "Doanh nghiệp có yêu cầu kiểm soát",
    price: "Báo giá riêng",
    cycle: "theo quy mô",
    capacity: "Từ 1.500+ CV / tháng",
    tone: "violet",
    summary: "Dành cho tổ chức cần hỗ trợ triển khai, kiểm soát và khung vận hành phù hợp nội bộ.",
    features: [
      "Tư vấn quy trình theo phòng ban",
      "Tài liệu bảo mật, lưu trữ và quy trình rà soát",
      "Hỗ trợ triển khai và đào tạo đội ngũ",
      "Kế hoạch mở rộng tính năng và tích hợp",
    ],
    ctaLabel: "Liên hệ tư vấn",
    ctaHref: "/book-demo",
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
