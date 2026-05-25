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
    name: "Starter",
    audience: "Nhom recruitment nho",
    price: "Lien he",
    cycle: "goi co ban",
    capacity: "Den 300 CV / thang",
    tone: "cyan",
    summary: "Danh cho doi ngu can mot luong screening gon, nhanh va de thu nghiem.",
    features: [
      "Import CV tu upload file va Google Drive",
      "OCR cho tai lieu scan",
      "Cham diem theo JD va shortlist co giai thich",
      "Luu lich su session de review lai",
    ],
    ctaLabel: "Dat lich demo",
    ctaHref: "/book-demo",
  },
  {
    name: "Growth",
    audience: "Phong HR dang mo rong",
    price: "Lien he",
    cycle: "goi de xuat",
    capacity: "Den 1.500 CV / thang",
    tone: "emerald",
    summary: "Phu hop cho doanh nghiep can xu ly nhieu vi tri va nhieu recruiter cung luc.",
    features: [
      "Quan ly nhieu session screening song song",
      "Bo cau hoi phong van theo shortlist",
      "Bo tieu chi va trong so theo tung vi tri",
      "Bao cao de chia se cho hiring manager",
    ],
    ctaLabel: "Xem bang gia chi tiet",
    ctaHref: "/pricing",
  },
  {
    name: "Enterprise",
    audience: "Doanh nghiep co yeu cau kiem soat",
    price: "Bao gia rieng",
    cycle: "theo quy mo",
    capacity: "Tu 1.500+ CV / thang",
    tone: "violet",
    summary: "Danh cho to chuc can onboarding, governance va khung van hanh phu hop noi bo.",
    features: [
      "Tu van workflow theo phong ban",
      "Tai lieu bao mat, retention va quy trinh review",
      "Ho tro trien khai va dao tao doi ngu",
      "Ke hoach mo rong tinh nang va tich hop",
    ],
    ctaLabel: "Lien he Sales",
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
    label: "Phan hoi",
    value: "Trong 1 ngay lam viec",
    href: "mailto:support@supporthr.vn?subject=Dat%20lich%20demo%20Support%20HR",
    icon: "fa-clock",
  },
];
