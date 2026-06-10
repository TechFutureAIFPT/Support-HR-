import React from 'react';
import { Link } from 'react-router-dom';
import { DocsFooter, DocsHeaderTabs, DocsTopBar } from '@/pages/info/legal-ui';
import { productDocsTabs } from '@/pages/info/docs-header-tabs';
import { bookDemoChannels } from '@/pages/info/business-docs-data';

const socialLinks = [
  { name: 'Facebook', icon: 'fa-brands fa-facebook', url: 'https://www.facebook.com/profile.php?id=61577736765345&locale=vi_VN' },
  { name: 'LinkedIn', icon: 'fa-brands fa-linkedin', url: 'https://www.linkedin.com/in/truong-minh-hoang-phuc-5ba70532b/' },
  { name: 'GitHub', icon: 'fa-brands fa-github', url: 'https://github.com/orgs/TechFutureAIFPT/dashboard' },
  { name: 'Discord', icon: 'fa-brands fa-discord', url: 'https://discord.gg/supporthr' },
];

const DeploymentReadyPage: React.FC = () => {
  return (
    <div className="legal-page-shell min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-10" />
      </div>

      <div className="relative z-10">
        <DocsTopBar brandContext="Tài liệu doanh nghiệp" auxiliaryLink={{ label: 'Đặt demo', to: '/book-demo' }} />
        <DocsHeaderTabs tabs={productDocsTabs} />

        <main className="mx-auto grid max-w-[96rem] gap-10 px-4 py-10 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="min-w-0">
            <p className="text-sm font-semibold text-blue-600">Deployment</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[1.08] tracking-normal text-slate-900">
              Sẵn sàng trao đổi triển khai Support HR
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Liên hệ để xem demo theo quy trình tuyển dụng thật, nhận tài liệu bảo mật và thống nhất bước triển khai phù hợp với đội ngũ.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { value: '1 ngày', label: 'Mục tiêu phản hồi', icon: 'fa-clock' },
                { value: 'JD + CV', label: 'Dữ liệu demo nên chuẩn bị', icon: 'fa-file-lines' },
                { value: 'Security docs', label: 'Tài liệu có thể gửi trước', icon: 'fa-shield-halved' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
                  <i className={`fa-solid ${stat.icon} text-sm text-blue-600`} />
                  <p className="mt-3 text-lg font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="tel:0899280108"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <i className="fa-solid fa-phone text-xs" />
                Gọi hotline
              </a>
              <Link
                to="/security"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-100 bg-white px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
              >
                Xem bảo mật
              </Link>
            </div>
          </section>

          <aside className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-blue-600">Kênh liên hệ</p>
            <div className="mt-5 space-y-3">
              {bookDemoChannels.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  className="block rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 transition-colors hover:border-blue-200 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600">
                      <i className={`fa-solid ${channel.icon} text-xs`} />
                    </span>
                    <span>
                      <span className="supporthr-mono block text-[10px] uppercase tracking-[0.2em] text-slate-500">{channel.label}</span>
                      <span className="mt-1 block text-sm font-semibold text-slate-900">{channel.value}</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-6 border-t border-blue-100 pt-5">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">Kết nối</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
                  >
                    <i className={`${social.icon} text-blue-600`} />
                    {social.name}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </main>
        <DocsFooter />
      </div>
    </div>
  );
};

export default DeploymentReadyPage;
