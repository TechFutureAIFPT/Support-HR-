import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Database,
  FileCheck2,
  FileText,
  HelpCircle,
  Layers3,
  LibraryBig,
  LockKeyhole,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { DocsFooter, DocsTopBar } from './legal-ui';

type IconType = React.ComponentType<{ className?: string; size?: number }>;

type DocSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: IconType;
  bullets: string[];
  cards?: Array<{
    title: string;
    description: string;
    meta?: string;
  }>;
  reference?: {
    method?: string;
    endpoint?: string;
    title: string;
    rows: Array<{ label: string; value: string }>;
  };
};

const routeToSection: Record<string, string> = {
  '/app-docs': 'tong-quan',
  '/process': 'quy-trinh',
  '/guide': 'quy-trinh',
  '/demo': 'trien-khai',
  '/book-demo': 'trien-khai',
  '/contact-ready': 'trien-khai',
  '/team': 'tong-quan',
  '/security': 'bao-mat',
  '/privacy-policy': 'bao-mat',
  '/terms': 'dieu-khoan',
  '/faq': 'faq',
  '/pricing': 'bang-gia',
  '/ai-methodology': 'ai-methodology',
  '/use-cases': 'use-cases',
  '/integrations': 'tich-hop',
};

const navGroups = [
  {
    title: 'Sản phẩm',
    items: [
      { label: 'Tổng quan', id: 'tong-quan' },
      { label: 'Quy trình sàng lọc', id: 'quy-trinh' },
      { label: 'Công cụ trong app', id: 'cong-cu' },
      { label: 'Tình huống sử dụng', id: 'use-cases' },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { label: 'Chuẩn hóa JD', id: 'chuan-hoa-jd' },
      { label: 'Thư viện CV', id: 'thu-vien-cv' },
      { label: 'Phương pháp AI', id: 'ai-methodology' },
      { label: 'Tích hợp', id: 'tich-hop' },
    ],
  },
  {
    title: 'Doanh nghiệp',
    items: [
      { label: 'Bảo mật dữ liệu', id: 'bao-mat' },
      { label: 'Bảng giá & triển khai', id: 'bang-gia' },
      { label: 'Doanh nghiệp thử nghiệm', id: 'doi-tac-thu-nghiem' },
      { label: 'Điều khoản', id: 'dieu-khoan' },
      { label: 'Câu hỏi thường gặp', id: 'faq' },
    ],
  },
];

const workflowSteps = [
  {
    icon: UploadCloud,
    title: 'Nạp JD và hồ sơ',
    detail: 'Đưa JD, CV hoặc hồ sơ từ thư viện vào cùng một phiên làm việc.',
  },
  {
    icon: ClipboardList,
    title: 'Thiết lập mặc định',
    detail: 'Chuẩn hóa bộ lọc cứng, trọng số và tiêu chí bắt buộc trước khi AI phân tích.',
  },
  {
    icon: Sparkles,
    title: 'Phân tích AI',
    detail: 'Xếp hạng ứng viên theo điểm phù hợp, bằng chứng CV và vùng cần rà soát.',
  },
  {
    icon: MessageSquareText,
    title: 'Feedback sau phân tích',
    detail: 'Ghi nhận phản hồi để cải thiện shortlist và giữ tính nhất quán cho lần sau.',
  },
];

const toolCards = [
  {
    icon: LibraryBig,
    title: 'Thư viện CV',
    href: '/records',
    description: 'Tổng hợp hồ sơ đã lọc từ nhiều phiên, có tìm kiếm, lọc, xem chi tiết và chọn lại ứng viên.',
  },
  {
    icon: FileText,
    title: 'Mẫu JD',
    href: '/jd-templates',
    description: 'Lưu lại các JD thường dùng để khởi tạo nhanh quy trình tuyển dụng mới.',
  },
  {
    icon: Workflow,
    title: 'Chuẩn hóa JD',
    href: '/jd-standardizer',
    description: 'Tối ưu JD, phát hiện phần còn thiếu và đưa bản chuẩn hóa vào luồng sàng lọc CV.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard phân tích',
    href: '/detailed-analytics',
    description: 'Theo dõi phân bổ hạng, điểm trung bình, tiêu chí yếu và danh sách ứng viên ưu tiên.',
  },
];

const sections: DocSection[] = [
  {
    id: 'tong-quan',
    eyebrow: 'Overview',
    title: 'Support HR là gì?',
    description:
      'Support HR là phần mềm AI hỗ trợ đội tuyển dụng đọc JD, chuẩn hóa tiêu chí, phân tích CV, xếp hạng ứng viên và lưu lại kết quả trong một quy trình có thể giải trình.',
    icon: BookOpen,
    bullets: [
      'Tập trung vào quy trình tuyển dụng thực tế: JD trước, CV sau, tiêu chí rõ rồi mới phân tích.',
      'Kết quả không chỉ là điểm số; mỗi ứng viên có bằng chứng, nhận định và cảnh báo để HR kiểm tra.',
      'Phù hợp cho HR nội bộ, Talent Acquisition, hiring manager và doanh nghiệp SME đang mở rộng đội ngũ.',
    ],
    cards: [
      {
        title: 'Tốc độ',
        description: 'Rút ngắn thời gian đọc hồ sơ đầu vào và tạo shortlist ban đầu.',
        meta: 'AI hỗ trợ',
      },
      {
        title: 'Minh bạch',
        description: 'Mỗi điểm đánh giá đều đi cùng tiêu chí và bằng chứng từ CV/JD.',
        meta: 'Có bằng chứng',
      },
      {
        title: 'Nhất quán',
        description: 'Bộ lọc, trọng số và phản hồi được chuẩn hóa giữa nhiều phiên tuyển dụng.',
        meta: 'Quy trình chung',
      },
    ],
  },
  {
    id: 'quy-trinh',
    eyebrow: 'Workflow',
    title: 'Quy trình sàng lọc ứng viên',
    description:
      'Luồng chính gồm bốn bước: nạp JD/CV, thiết lập mặc định, phân tích AI và phản hồi sau phân tích. Các công cụ phụ hỗ trợ nhưng không làm thay đổi logic tuyển dụng.',
    icon: Workflow,
    bullets: [
      'Nếu JD đã sẵn sàng, người dùng có thể đi tiếp sang nạp CV mà không phải tải lại.',
      'Nếu CV đã đủ, quy trình tiếp tục sang thiết lập trọng số để giữ luồng phân tích liền mạch.',
      'Phân tích AI chỉ chạy sau khi dữ liệu và tiêu chí đầu vào đã được kiểm tra.',
    ],
    reference: {
      title: 'Luồng dữ liệu chính',
      rows: [
        { label: 'Bước 01', value: 'Nạp JD hoặc dùng JD đã chuẩn hóa' },
        { label: 'Bước 02', value: 'Nạp CV từ file, Drive hoặc thư viện CV' },
        { label: 'Bước 03', value: 'Thiết lập bộ lọc cứng và trọng số' },
        { label: 'Bước 04', value: 'Phân tích, xem dashboard và phản hồi' },
      ],
    },
  },
  {
    id: 'cong-cu',
    eyebrow: 'Tools',
    title: 'Công cụ hỗ trợ trong ứng dụng',
    description:
      'Các công cụ phụ được gom theo mục đích sử dụng: lưu hồ sơ, lưu mẫu JD, chuẩn hóa mô tả công việc, xem thống kê và hỏi trợ lý tuyển dụng AI.',
    icon: Layers3,
    bullets: [
      'Thư viện CV giúp lấy lại hồ sơ đã lọc để dùng tiếp trong phiên mới.',
      'Mẫu JD và chuẩn hóa JD giúp giảm thao tác lặp lại khi mở vị trí tuyển dụng tương tự.',
      'Trợ lý tuyển dụng AI dùng dữ liệu hiện có để gợi ý ứng viên, nhóm ứng viên và câu hỏi phỏng vấn.',
    ],
  },
  {
    id: 'chuan-hoa-jd',
    eyebrow: 'JD Standardizer',
    title: 'Chuẩn hóa JD',
    description:
      'Trang chuẩn hóa JD giúp chuyển mô tả công việc thô thành bản rõ cấu trúc hơn, có điểm chất lượng, phần còn thiếu, điểm yếu và gợi ý cải thiện.',
    icon: FileCheck2,
    bullets: [
      'Có thể nhập JD dạng text hoặc tải file JD.',
      'Có trường bổ sung cho công ty, lương, địa điểm, thời gian làm việc, quyền lợi và ghi chú.',
      'Kết quả có thể sao chép, lưu thành mẫu JD hoặc dùng trực tiếp cho quy trình nạp JD.',
    ],
    reference: {
      method: 'POST',
      endpoint: '/api/mobile/jd/standardize',
      title: 'Chuẩn hóa từ nội dung JD',
      rows: [
        { label: 'Input', value: 'JD text, vị trí, công ty, quyền lợi, ghi chú' },
        { label: 'Output', value: 'Điểm chất lượng, phần thiếu, gợi ý và JD chuẩn hóa' },
        { label: 'Action', value: 'Dùng JD này, lưu mẫu JD, sao chép JD' },
      ],
    },
  },
  {
    id: 'thu-vien-cv',
    eyebrow: 'Records',
    title: 'Thư viện CV đã lọc',
    description:
      'Thư viện CV tổng hợp ứng viên từ các phiên đã phân tích để HR có thể tìm lại, lọc theo hạng/điểm/vị trí, xem bằng chứng rút gọn và đưa hồ sơ vào lượt lọc tiếp theo.',
    icon: LibraryBig,
    bullets: [
      'Nguồn dữ liệu dùng lịch sử phân tích từ backend, không chỉ phiên đang mở.',
      'Có tìm kiếm, lọc theo hạng, lọc theo điểm, sắp xếp theo mới nhất hoặc điểm cao nhất.',
      'Có detail drawer để xem điểm mạnh, điểm yếu, cảnh báo và bằng chứng chính.',
    ],
    reference: {
      method: 'GET',
      endpoint: '/api/account/mobile-inbox',
      title: 'Nguồn hồ sơ đã lọc',
      rows: [
        { label: 'Danh sách', value: 'Tên ứng viên, file CV, vị trí, điểm, hạng' },
        { label: 'Chi tiết', value: 'Phiên phân tích, điểm mạnh/yếu, cảnh báo, evidence' },
        { label: 'Hành động', value: 'Chọn lại ứng viên, mở feedback, xuất CSV' },
      ],
    },
  },
  {
    id: 'ai-methodology',
    eyebrow: 'AI Methodology',
    title: 'Cách AI đánh giá ứng viên',
    description:
      'AI của Support HR được thiết kế để hỗ trợ quyết định, không thay thế người tuyển dụng. Hệ thống dùng JD, trọng số và bộ lọc để tạo điểm phù hợp có bằng chứng.',
    icon: Sparkles,
    bullets: [
      'Bộ lọc cứng loại trừ các điều kiện bắt buộc không đạt trước khi chấm điểm chi tiết.',
      'Trọng số giúp phản ánh mức độ quan trọng của Job Fit, kinh nghiệm, kỹ năng, học vấn, ngôn ngữ và các nhóm tiêu chí khác.',
      'Mỗi kết quả có giải thích, bằng chứng CV và vùng cần xác thực để HR kiểm tra lại.',
    ],
    cards: [
      {
        title: 'Job Fit',
        description: 'Đo mức độ phù hợp giữa yêu cầu JD và năng lực/kinh nghiệm thể hiện trong CV.',
        meta: 'Cốt lõi',
      },
      {
        title: 'Evidence',
        description: 'Hiển thị đoạn bằng chứng, nhận định và lý do chấm điểm để dễ trao đổi.',
        meta: 'Giải trình',
      },
      {
        title: 'Feedback loop',
        description: 'Phản hồi sau phân tích giúp quy trình ngày càng sát kỳ vọng tuyển dụng hơn.',
        meta: 'Cải thiện',
      },
    ],
  },
  {
    id: 'use-cases',
    eyebrow: 'Use cases',
    title: 'Tình huống sử dụng phổ biến',
    description:
      'Support HR phù hợp với các đội cần xử lý nhiều hồ sơ nhưng vẫn phải giữ quy trình đánh giá rõ ràng và kiểm soát được.',
    icon: UsersRound,
    bullets: [
      'Tuyển nhanh nhiều vị trí tương tự nhau mà vẫn giữ cùng bộ tiêu chí.',
      'Chuẩn bị shortlist cho hiring manager trước buổi họp tuyển dụng.',
      'So sánh ứng viên theo năng lực, kinh nghiệm, mức phù hợp JD và cảnh báo cần rà soát.',
    ],
    cards: [
      {
        title: 'HR Manager',
        description: 'Kiểm soát quy trình, chất lượng shortlist và tính nhất quán trong đánh giá.',
      },
      {
        title: 'Talent Acquisition',
        description: 'Rút ngắn thời gian đọc CV và có danh sách ưu tiên để trao đổi ứng viên nhanh hơn.',
      },
      {
        title: 'Hiring Manager',
        description: 'Nhận báo cáo dễ hiểu, tập trung vào năng lực, kinh nghiệm và mức độ phù hợp.',
      },
    ],
  },
  {
    id: 'tich-hop',
    eyebrow: 'Integrations',
    title: 'Tích hợp và dữ liệu đầu vào',
    description:
      'Support HR được thiết kế để bổ sung vào quy trình tuyển dụng hiện có. Người dùng có thể dùng file, Google Drive, thư viện CV và các endpoint backend hiện có.',
    icon: Database,
    bullets: [
      'Hỗ trợ tài liệu JD/CV phổ biến như PDF, DOCX, PNG và JPG theo cấu hình upload hiện tại.',
      'Google Drive được đồng bộ giao diện để người dùng lấy tài liệu mà không rời khỏi luồng làm việc.',
      'Dữ liệu kết quả có thể hiển thị trên dashboard, thư viện CV và feedback workflow.',
    ],
    reference: {
      title: 'Nguồn dữ liệu',
      rows: [
        { label: 'File', value: 'JD/CV từ máy tính hoặc Drive' },
        { label: 'Backend', value: 'Lịch sử phân tích, inbox mobile, mẫu JD' },
        { label: 'Output', value: 'Dashboard, thư viện CV, feedback, CSV khi cần' },
      ],
    },
  },
  {
    id: 'bao-mat',
    eyebrow: 'Security',
    title: 'Bảo mật dữ liệu tuyển dụng',
    description:
      'Dữ liệu JD/CV là dữ liệu nghiệp vụ nhạy cảm. Support HR hiển thị rõ phạm vi sử dụng, quyền kiểm soát và trách nhiệm kiểm tra của người dùng.',
    icon: ShieldCheck,
    bullets: [
      'Dữ liệu JD/CV chỉ dùng để phục vụ quy trình sàng lọc của tài khoản đang thao tác.',
      'Người dùng chịu trách nhiệm đảm bảo quyền sử dụng CV và dữ liệu ứng viên trước khi tải lên.',
      'Không nên tải dữ liệu ngoài phạm vi tuyển dụng hoặc dữ liệu nhạy cảm khi doanh nghiệp chưa có chính sách cho phép.',
    ],
    cards: [
      {
        title: 'Phân quyền',
        description: 'Các route công cụ được bảo vệ theo trạng thái đăng nhập của ứng dụng.',
      },
      {
        title: 'Kiểm soát',
        description: 'HR có thể xem lại danh sách hồ sơ, chi tiết bằng chứng và phản hồi sau phân tích.',
      },
      {
        title: 'Trách nhiệm',
        description: 'AI là công cụ hỗ trợ; quyết định tuyển dụng cuối cùng thuộc về đội HR và hiring manager.',
      },
    ],
  },
  {
    id: 'bang-gia',
    eyebrow: 'Pricing',
    title: 'Bảng giá và triển khai',
    description:
      'Support HR có thể triển khai theo nhu cầu sử dụng: thử nghiệm quy trình, mở rộng đội tuyển dụng hoặc cấu hình riêng cho doanh nghiệp.',
    icon: BriefcaseBusiness,
    bullets: [
      'Gói thử nghiệm phù hợp để kiểm tra luồng JD/CV và dashboard phân tích.',
      'Gói đội nhóm phù hợp với HR nội bộ hoặc agency cần xử lý nhiều phiên tuyển dụng.',
      'Gói doanh nghiệp có thể cấu hình theo quy trình, tích hợp và yêu cầu quản trị dữ liệu.',
    ],
    cards: [
      {
        title: 'Starter',
        description: 'Dùng thử quy trình, nạp JD/CV và xem kết quả phân tích cơ bản.',
        meta: 'Khởi động',
      },
      {
        title: 'Team',
        description: 'Thêm thư viện CV, feedback workflow và dashboard phân tích chi tiết.',
        meta: 'Đội nhóm',
      },
      {
        title: 'Enterprise',
        description: 'Tùy chỉnh tích hợp, phân quyền, báo cáo và quy trình triển khai riêng.',
        meta: 'Liên hệ',
      },
    ],
  },
  {
    id: 'doi-tac-thu-nghiem',
    eyebrow: 'Pilot partners',
    title: 'Doanh nghiệp hợp tác thử nghiệm sản phẩm',
    description:
      'Khu vực này dùng để giới thiệu các nhóm doanh nghiệp đang phối hợp đánh giá Support HR trong môi trường thử nghiệm. Tên và logo chính thức chỉ nên công bố khi đã được đối tác xác nhận.',
    icon: BriefcaseBusiness,
    bullets: [
      'Ưu tiên các doanh nghiệp có nhu cầu sàng lọc nhiều CV, chuẩn hóa JD và phối hợp nhanh giữa HR với hiring manager.',
      'Mỗi chương trình thử nghiệm nên có phạm vi rõ: vị trí tuyển dụng, số lượng CV mẫu, tiêu chí đánh giá và người phụ trách phản hồi.',
      'Sau giai đoạn thử nghiệm, đội triển khai tổng hợp phản hồi về độ chính xác, tốc độ xử lý, trải nghiệm sử dụng và yêu cầu tích hợp.',
    ],
    cards: [
      {
        title: 'Doanh nghiệp công nghệ',
        description: 'Thử nghiệm luồng tuyển kỹ sư, sản phẩm, dữ liệu và các vị trí cần so sánh kỹ năng theo JD.',
        meta: 'Pilot',
      },
      {
        title: 'Đơn vị dịch vụ nhân sự',
        description: 'Đánh giá khả năng xử lý nhiều JD, nhiều nguồn CV và tạo shortlist có bằng chứng cho khách hàng.',
        meta: 'HR agency',
      },
      {
        title: 'SME đang mở rộng',
        description: 'Kiểm tra cách chuẩn hóa tiêu chí tuyển dụng khi đội HR nhỏ cần xử lý hồ sơ nhanh hơn.',
        meta: 'SME',
      },
    ],
    reference: {
      title: 'Thông tin cần xác nhận trước khi công bố',
      rows: [
        { label: 'Tên đối tác', value: 'Tên doanh nghiệp, ngành hoạt động và người phụ trách xác nhận thông tin.' },
        { label: 'Phạm vi thử nghiệm', value: 'Số lượng JD/CV, nhóm vị trí, thời gian pilot và dữ liệu được phép sử dụng.' },
        { label: 'Quyền công bố', value: 'Trạng thái cho phép hiển thị tên, logo, nhận xét hoặc chỉ mô tả theo nhóm ẩn danh.' },
      ],
    },
  },
  {
    id: 'dieu-khoan',
    eyebrow: 'Terms',
    title: 'Điều khoản sử dụng chính',
    description:
      'Các điều khoản được viết để làm rõ vai trò của Support HR trong quy trình tuyển dụng và phạm vi trách nhiệm khi dùng AI.',
    icon: LockKeyhole,
    bullets: [
      'Người dùng cần cung cấp dữ liệu đầu vào hợp pháp, chính xác và phù hợp với mục đích tuyển dụng.',
      'Kết quả AI là nguồn tham khảo có cấu trúc, không phải quyết định tuyển dụng tự động.',
      'Doanh nghiệp cần tự đánh giá tuân thủ nội bộ, quy định lao động và chính sách bảo vệ dữ liệu liên quan.',
    ],
    reference: {
      title: 'Nguyên tắc sử dụng',
      rows: [
        { label: 'Dữ liệu', value: 'Chỉ tải dữ liệu được phép xử lý' },
        { label: 'Quyết định', value: 'HR hoặc hiring manager là người phê duyệt cuối cùng' },
        { label: 'Kiểm tra', value: 'Luôn đọc bằng chứng và cảnh báo trước khi hành động' },
      ],
    },
  },
  {
    id: 'trien-khai',
    eyebrow: 'Deployment',
    title: 'Chuẩn bị demo và triển khai',
    description:
      'Để đánh giá nhanh Support HR, đội tuyển dụng chỉ cần một JD thật, một nhóm CV mẫu và quy tắc tuyển dụng đang dùng.',
    icon: BadgeCheck,
    bullets: [
      'Chuẩn bị JD của vị trí cần tuyển, tốt nhất là bản đang được dùng thực tế.',
      'Chuẩn bị 5-20 CV mẫu để xem cách hệ thống phân tích, xếp hạng và giải thích.',
      'Xác định các tiêu chí bắt buộc như địa điểm, kinh nghiệm tối thiểu, ngôn ngữ hoặc hình thức làm việc.',
    ],
    cards: [
      {
        title: 'Trước demo',
        description: 'Chọn vị trí tuyển dụng, JD và hồ sơ mẫu.',
      },
      {
        title: 'Trong demo',
        description: 'Chạy luồng JD -> CV -> trọng số -> phân tích -> feedback.',
      },
      {
        title: 'Sau demo',
        description: 'Đánh giá độ phù hợp, dữ liệu cần bổ sung và cách tích hợp vào quy trình hiện tại.',
      },
    ],
  },
  {
    id: 'faq',
    eyebrow: 'FAQ',
    title: 'Câu hỏi thường gặp',
    description:
      'Các câu hỏi ngắn dành cho người mới bắt đầu dùng Support HR hoặc cần giải thích nhanh cho đội nội bộ.',
    icon: HelpCircle,
    bullets: [
      'Support HR không thay thế nhà tuyển dụng; sản phẩm giúp chuẩn hóa dữ liệu để HR quyết định tốt hơn.',
      'Có thể dùng lại CV đã lọc từ thư viện CV cho lượt phân tích tiếp theo nếu dữ liệu còn phù hợp.',
      'JD chuẩn hóa có thể đưa vào quy trình nạp JD và dùng tiếp cho bước nạp CV.',
      'Nếu backend không có dữ liệu lịch sử, các trang thư viện sẽ hiển thị trạng thái trống rõ ràng.',
    ],
  },
];

const rightLinks = [
  { label: 'Tổng quan', id: 'tong-quan' },
  { label: 'Quy trình', id: 'quy-trinh' },
  { label: 'Chuẩn hóa JD', id: 'chuan-hoa-jd' },
  { label: 'Thư viện CV', id: 'thu-vien-cv' },
  { label: 'Doanh nghiệp thử nghiệm', id: 'doi-tac-thu-nghiem' },
  { label: 'Bảo mật', id: 'bao-mat' },
  { label: 'FAQ', id: 'faq' },
];

const AppDocumentationPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const hashTarget = location.hash.replace('#', '');
    const routeTarget = routeToSection[location.pathname];
    const target = hashTarget || routeTarget;
    if (!target) return;

    window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 40);
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-900">
      <DocsTopBar auxiliaryLink={{ label: 'Hướng dẫn sử dụng', to: '/guide' }} brandContext="Trung tâm tài liệu" />
      <header className="hidden">
        <div className="mx-auto flex min-h-20 w-full max-w-[1520px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/jd" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
              <img src="/images/logos/logo.jpg" alt="Support HR" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-base font-black uppercase tracking-[0.18em] text-slate-950">
                Support HR
              </span>
              <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">
                Tài liệu ứng dụng
              </span>
            </span>
          </Link>

          <div className="hidden min-w-[360px] max-w-xl flex-1 items-center rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-2 shadow-sm md:flex">
            <Search size={18} className="text-blue-500" />
            <span className="ml-3 text-sm font-semibold text-slate-500">
              Tìm quy trình, chính sách, công cụ...
            </span>
            <span className="ml-auto rounded-lg border border-blue-100 bg-white px-2 py-1 text-[11px] font-black text-slate-500">
              Ctrl K
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/welcome"
              className="hidden rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 sm:inline-flex"
            >
              Trang chào mừng
            </Link>
            <Link
              to="/jd"
              className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700"
            >
              Vào ứng dụng
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden">
          <nav className="sticky top-[58px] max-h-[calc(100vh-82px)] overflow-y-auto rounded-3xl border border-blue-100 bg-white p-4 shadow-[0_20px_50px_rgba(30,64,175,0.08)]">
            <p className="px-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Documentation</p>
            <div className="mt-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                    {group.title}
                  </p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <div className="min-w-0">
          <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.10)]">
            <div className="grid gap-8 p-6 lg:grid-cols-[1fr_420px] lg:p-8 xl:p-10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
                  Support HR docs
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                  Trung tâm tài liệu cho phần mềm lọc CV bằng AI
                </h1>
                <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-600">
                  Một nơi để đọc tổng quan sản phẩm, quy trình JD/CV, công cụ hỗ trợ, phương pháp AI, bảo mật,
                  điều khoản, tích hợp và hướng dẫn triển khai Support HR.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/jd"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700"
                  >
                    Bắt đầu sàng lọc
                    <ArrowRight size={17} />
                  </Link>
                  <a
                    href="#quy-trinh"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700 hover:bg-blue-100"
                  >
                    Xem quy trình
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
                <div className="rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Sparkles size={18} />
                      </span>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                          Product reference
                        </p>
                        <h2 className="text-base font-black text-slate-950">Luồng tuyển dụng</h2>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      Sẵn sàng
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {workflowSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.title} className="flex gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] p-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                            <Icon size={18} />
                          </span>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                              Bước {String(index + 1).padStart(2, '0')}
                            </p>
                            <h3 className="text-sm font-black text-slate-950">{step.title}</h3>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{step.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="cong-cu" className="mt-6 scroll-mt-24 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_20px_60px_rgba(30,64,175,0.08)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Công cụ nhanh</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Đi thẳng vào trang cần dùng</h2>
              </div>
              <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Các công cụ này dùng dữ liệu ứng dụng, không phải nội dung marketing.
              </p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {toolCards.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.title}
                    to={tool.href}
                    className="group rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Icon size={19} />
                    </span>
                    <h3 className="mt-4 text-base font-black text-slate-950">{tool.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{tool.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                      Mở trang
                      <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="mt-6 space-y-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_18px_52px_rgba(30,64,175,0.07)] sm:p-6"
                >
                  <div className="flex flex-col gap-4 border-b border-blue-100 pb-5 sm:flex-row sm:items-start">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                      <Icon size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">{section.eyebrow}</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">{section.title}</h2>
                      <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-3">
                      {section.bullets.map((bullet) => (
                        <div key={bullet} className="flex gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          <p className="text-sm font-semibold leading-6 text-slate-700">{bullet}</p>
                        </div>
                      ))}
                    </div>

                    {section.reference ? (
                      <ReferenceCard reference={section.reference} />
                    ) : (
                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Ghi chú vận hành</p>
                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                          Nội dung này được áp dụng trong app chính và có thể mở trực tiếp bằng các nút trong header hoặc menu tài khoản.
                        </p>
                      </div>
                    )}
                  </div>

                  {section.cards && (
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {section.cards.map((card) => (
                        <article key={card.title} className="rounded-2xl border border-blue-100 bg-white p-4">
                          {card.meta && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
                              {card.meta}
                            </span>
                          )}
                          <h3 className="mt-3 text-base font-black text-slate-950">{card.title}</h3>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{card.description}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        <aside className="hidden">
          <div className="sticky top-[58px] space-y-4">
            <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-[0_18px_50px_rgba(30,64,175,0.08)]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Trong trang này</p>
              <div className="mt-3 space-y-1">
                {rightLinks.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-[0_18px_50px_rgba(30,64,175,0.08)]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Truy cập nhanh</p>
              <div className="mt-3 space-y-2">
                <QuickLink to="/jd" label="Nạp JD/CV" />
                <QuickLink to="/records" label="Thư viện CV" />
                <QuickLink to="/jd-standardizer" label="Chuẩn hóa JD" />
                <QuickLink to="/detailed-analytics" label="Dashboard" />
              </div>
            </div>
          </div>
        </aside>
      </main>
      <DocsFooter />
    </div>
  );
};

type ReferenceCardProps = {
  reference: NonNullable<DocSection['reference']>;
};

const ReferenceCard: React.FC<ReferenceCardProps> = ({ reference }) => {
  return (
    <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Reference</p>
          <h3 className="mt-2 text-base font-black text-slate-950">{reference.title}</h3>
        </div>
        {reference.method && (
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
            {reference.method}
          </span>
        )}
      </div>
      {reference.endpoint && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-white px-3 py-2 font-mono text-xs font-bold text-blue-700">
          {reference.endpoint}
        </div>
      )}
      <div className="mt-4 space-y-2">
        {reference.rows.map((row) => (
          <div key={`${row.label}-${row.value}`} className="rounded-xl border border-blue-100 bg-white p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{row.label}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link
    to={to}
    className="flex items-center justify-between rounded-xl border border-blue-100 bg-[#f8fbff] px-3 py-2 text-sm font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700"
  >
    {label}
    <ArrowRight size={14} />
  </Link>
);

export default AppDocumentationPage;
