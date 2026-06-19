import React from "react";
import { DocsFooter, DocsTopBar } from "./legal-ui";

const faqGroups = [
  {
    id: "bat-dau",
    title: "Bắt đầu sử dụng",
    questions: [
      {
        question: "Support HR phù hợp với đội ngũ nào?",
        answer: "Sản phẩm phù hợp với đội tuyển dụng cần chuẩn hóa JD, xử lý nhiều CV và tạo danh sách ứng viên có lý do rõ ràng để cùng rà soát.",
      },
      {
        question: "Cần chuẩn bị gì cho phiên sàng lọc đầu tiên?",
        answer: "Bạn cần một JD cho vị trí đang tuyển và bộ CV thực tế. Sau khi tải dữ liệu lên, hãy kiểm tra điều kiện bắt buộc và trọng số trước khi chạy phân tích.",
      },
    ],
  },
  {
    id: "du-lieu",
    title: "CV và dữ liệu",
    questions: [
      {
        question: "Có thể lấy CV từ đâu?",
        answer: "Bạn có thể tải file trực tiếp hoặc chọn tài liệu từ Google Drive đã được cấp quyền. Hệ thống chỉ xử lý tài liệu người dùng chủ động chọn.",
      },
      {
        question: "Lịch sử phân tích có được lưu lại không?",
        answer: "Kết quả có thể được lưu trong lịch sử tài khoản để xem lại và bàn giao. Người dùng có thể điều chỉnh đồng bộ hoặc xóa dữ liệu trong phần Cài đặt.",
      },
    ],
  },
  {
    id: "danh-gia",
    title: "Đánh giá ứng viên",
    questions: [
      {
        question: "Điểm phù hợp có thay thế quyết định của HR không?",
        answer: "Không. Điểm số, bằng chứng và cảnh báo hỗ trợ vòng rà soát ban đầu; quyết định tuyển dụng cuối cùng vẫn thuộc về nhà tuyển dụng và doanh nghiệp.",
      },
      {
        question: "Nếu CV thiếu dữ liệu thì hệ thống xử lý thế nào?",
        answer: "Thông tin không xuất hiện trong CV phải được đánh dấu là chưa tìm thấy hoặc cần HR rà soát, thay vì tự suy đoán năng lực của ứng viên.",
      },
    ],
  },
];

const FAQPage: React.FC = () => (
  <div className="legal-page-shell min-h-screen bg-[#f6f9ff] text-slate-900">
    <DocsTopBar auxiliaryLink={{ label: "Bảo mật dữ liệu", to: "/security" }} brandContext="Trung tâm tài liệu" />
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-blue-600">Tài liệu Support HR</p>
        <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-tight tracking-[-0.03em] text-slate-950">
          Câu hỏi thường gặp
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
          Giải đáp ngắn gọn về cách bắt đầu, dữ liệu CV và vai trò của kết quả đánh giá trong quy trình tuyển dụng.
        </p>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Mục lục câu hỏi thường gặp">
        {faqGroups.map((group) => (
          <a key={group.id} href={`#${group.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700">
            {group.title}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-10">
        {faqGroups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-28">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">{group.title}</h2>
            <div className="mt-4 divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-white px-5 shadow-sm">
              {group.questions.map((item) => (
                <article key={item.question} className="py-5">
                  <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
    <DocsFooter />
  </div>
);

export default FAQPage;
