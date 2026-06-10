import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const faqs = [
  {
    question: "1. Support HR phù hợp với quy trình tuyển dụng nào?",
    answer:
      "Support HR phù hợp cho đội HR nội bộ, agency tuyển dụng và doanh nghiệp SME cần sàng lọc nhiều CV, chuẩn hóa tiêu chí đánh giá và phối hợp nhanh với hiring manager.",
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
      "Có. Một phiên tuyển dụng có thể nạp nhiều hồ sơ, theo dõi danh sách CV, so sánh điểm phù hợp và tạo shortlist để chuyển sang bước phản hồi hoặc phỏng vấn.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative border-b border-blue-100 bg-white py-20 sm:py-24">
      <div className="home-section-frame">
        <div className="mx-auto max-w-[68rem] text-center">
          <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Câu hỏi thường gặp
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Những điểm đội tuyển dụng thường cần làm rõ trước khi đưa AI vào bước sàng lọc hồ sơ.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-[86rem] space-y-4">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={item.question}
                className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_14px_38px_rgba(30,64,175,0.06)] transition-colors hover:border-blue-200"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-5 px-5 py-6 text-left sm:px-8 sm:py-7"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                      isOpen
                        ? "border-blue-200 bg-blue-600 text-white"
                        : "border-blue-100 bg-blue-50 text-blue-600"
                    }`}
                    aria-hidden="true"
                  >
                    {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-blue-100 px-5 pb-7 pt-5 text-base leading-8 text-slate-600 sm:px-8">
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
