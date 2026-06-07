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
    <div className="legal-page-shell min-h-screen overflow-x-hidden bg-black text-zinc-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="supporthr-grid-mask absolute inset-0 opacity-25" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent)]" />
      </div>

      <div className="relative z-10">
        <DocsTopBar brandContext="Tài liệu doanh nghiệp" auxiliaryLink={{ label: 'Đặt demo', to: '/book-demo' }} />
        <DocsHeaderTabs tabs={productDocsTabs} />

        <main className="mx-auto grid max-w-[96rem] gap-10 px-4 py-10 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="min-w-0">
            <p className="text-sm font-semibold text-[#f5d6bb]">Deployment</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-white">
              Sẵn sàng trao đổi triển khai Support HR
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Liên hệ để xem demo theo quy trình tuyển dụng thật, nhận tài liệu bảo mật và thống nhất bước triển khai phù hợp với đội ngũ.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { value: '1 ngày', label: 'Mục tiêu phản hồi', icon: 'fa-clock' },
                { value: 'JD + CV', label: 'Dữ liệu demo nên chuẩn bị', icon: 'fa-file-lines' },
                { value: 'Security docs', label: 'Tài liệu có thể gửi trước', icon: 'fa-shield-halved' },
              ].map((stat) => (
                <div key={stat.label} className="border border-white/10 bg-white/[0.025] px-5 py-4">
                  <i className={`fa-solid ${stat.icon} text-sm text-[#f5d6bb]`} />
                  <p className="mt-3 text-lg font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="tel:0899280108"
                className="inline-flex h-11 items-center justify-center gap-2 bg-white px-6 supporthr-mono text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-100"
              >
                <i className="fa-solid fa-phone text-xs" />
                Gọi hotline
              </a>
              <Link
                to="/security"
                className="inline-flex h-11 items-center justify-center border border-white/12 px-6 supporthr-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/24 hover:bg-white/[0.03]"
              >
                Xem bảo mật
              </Link>
            </div>
          </section>

          <aside className="border border-[#f5d6bb]/18 bg-[linear-gradient(180deg,rgba(245,214,187,0.06),rgba(255,255,255,0.018))] p-5">
            <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-[#f5d6bb]/75">Kênh liên hệ</p>
            <div className="mt-5 space-y-3">
              {bookDemoChannels.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  className="block border border-white/10 bg-black/35 px-4 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.035]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-[#f5d6bb]/22 bg-[#f5d6bb]/[0.06] text-[#f5d6bb]">
                      <i className={`fa-solid ${channel.icon} text-xs`} />
                    </span>
                    <span>
                      <span className="supporthr-mono block text-[10px] uppercase tracking-[0.2em] text-zinc-500">{channel.label}</span>
                      <span className="mt-1 block text-sm font-semibold text-white">{channel.value}</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-6 border-t border-white/8 pt-5">
              <p className="supporthr-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Kết nối</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-white/10 bg-black/25 px-3 py-3 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                  >
                    <i className={`${social.icon} text-[#f5d6bb]`} />
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
