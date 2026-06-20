import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const faqs = [
  {
    question: "1. Support HR phù hợp với quy trình tuyển dụng nào?",
    answer:
      "Support HR phù hợp cho đội HR nội bộ, đơn vị tuyển dụng và doanh nghiệp SME cần sàng lọc nhiều CV, chuẩn hóa tiêu chí đánh giá và phối hợp nhanh với quản lý tuyển dụng.",
  },
  {
    question: "2. Cần chuẩn bị dữ liệu gì để bắt đầu?",
    answer:
      "Bạn chỉ cần có JD và danh sách CV hiện tại. Hệ thống sẽ đọc mô tả công việc, đề xuất tiêu chí, sau đó phân tích từng hồ sơ theo bộ tiêu chí đã được xác nhận.",
  },
  {
    question: "3. AI có tự quyết định thay HR không?",
    answer:
      "Không. AI hỗ trợ tóm tắt, chấm điểm và đưa ra bằng chứng tham khảo. HR vẫn là người kiểm soát tiêu chí, xem lại kết quả và đưa ra quyết định cuối cùng.",
  },
  {
    question: "4. Kết quả phân tích có giải thích lý do đề xuất không?",
    answer:
      "Có. Mỗi ứng viên được trình bày điểm tổng, điểm theo nhóm tiêu chí, bằng chứng trích từ CV và nhận định để đội tuyển dụng dễ trao đổi nội bộ.",
  },
  {
    question: "5. Có thể điều chỉnh tiêu chí và trọng số không?",
    answer:
      "Có. Bạn có thể chỉnh bộ lọc bắt buộc, nhóm tiêu chí và tỷ trọng đánh giá trước khi chạy phân tích để kết quả bám sát từng vị trí tuyển dụng.",
  },
  {
    question: "6. Support HR có hỗ trợ nhiều CV trong một phiên không?",
    answer:
      "Có. Một phiên tuyển dụng có thể nạp nhiều hồ sơ, theo dõi danh sách CV, so sánh điểm phù hợp và tạo danh sách đề cử để chuyển sang bước phản hồi hoặc phỏng vấn.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative bg-[#F4F6F8] py-20 sm:py-24">
      <div className="home-section-frame">
        <div className="mx-auto max-w-[68rem] text-center">
          <h2 className="font-space text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Câu hỏi thường gặp
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Những điểm đội tuyển dụng thường cần làm rõ trước khi đưa AI vào bước sàng lọc hồ sơ.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-[50rem] space-y-4">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={item.question}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.03)] hover:border-blue-200 hover:shadow-[0_18px_44px_rgba(37,99,235,0.07)] transition-all duration-300"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-5 px-5 py-5.5 text-left sm:px-7 sm:py-6"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-base font-bold leading-snug text-slate-900 sm:text-lg">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      isOpen
                        ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                    aria-hidden="true"
                  >
                    <div className={`relative h-4 w-4 flex items-center justify-center transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}>
                      <span className="absolute h-0.5 w-3.5 bg-current rounded-full" />
                      <span className={`absolute h-3.5 w-0.5 bg-current rounded-full transition-transform duration-300 ${isOpen ? "rotate-90 scale-y-0 opacity-0" : ""}`} />
                    </div>
                  </span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-slate-200/80 px-5 pb-6 pt-4.5 text-[0.925rem] leading-7 text-slate-600 sm:px-7">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
