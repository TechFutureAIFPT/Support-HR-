import React, { memo } from 'react';
import LazyImage from '@/components/common/LazyImage';

const Partners: React.FC = memo(() => {
  const partners = [
    { name: 'FPT', logo: '/images/logos/fpt.png' },
    { name: 'TopCV', logo: '/images/logos/topcv-1.png' },
    { name: 'Vinedimex', logo: '/images/logos/vinedimex-1.png' },
    { name: 'HB', logo: '/images/logos/hb.png' },
    { name: 'Mì AI', logo: '/images/logos/mi_ai.png' },
    // Fallback logos với placeholder icons
    { name: 'Microsoft', logo: '', icon: 'fa-brands fa-microsoft' },
    { name: 'Google', logo: '', icon: 'fa-brands fa-google' },
    { name: 'AWS', logo: '', icon: 'fa-brands fa-aws' },
  ];

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold text-slate-950">Đối tác hỗ trợ</h2>
          <p className="text-lg text-slate-600">
            Được tin tưởng và hỗ trợ bởi các công ty công nghệ hàng đầu
          </p>
        </div>
        
        <div className="overflow-hidden">
          <div className="flex animate-scroll-infinite">
            {/* Lặp logos 2 lần để tạo hiệu ứng cuộn liền mạch */}
            {[...Array(2)].map((_, groupIndex) => (
              <div key={groupIndex} className="flex">
                {partners.map((partner, index) => (
                  <div
                    key={`${groupIndex}-${index}`}
                    className="flex-shrink-0 mx-12 flex items-center justify-center h-24 w-40"
                  >
                    {partner.logo ? (
                      <LazyImage
                        src={partner.logo}
                        alt={`${partner.name} Logo`}
                        className="max-h-20 max-w-full object-contain brightness-100 contrast-100 saturate-100 hover:scale-110 hover:brightness-110 transition-all duration-300 filter-none"
                        fallbackIcon={partner.icon || 'fa-solid fa-building'}
                        draggable={false}
                      />
                    ) : (
                      <div 
                        className="flex h-16 w-16 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-500 transition-all duration-300 hover:scale-110 hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700"
                      >
                        <i className={`${partner.icon} text-2xl`}></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

Partners.displayName = 'Partners';

export default Partners;
