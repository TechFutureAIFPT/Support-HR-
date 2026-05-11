const INDUSTRY_RULES: Array<{ industry: string; keywords: string[] }> = [
  {
    industry: 'Software',
    keywords: ['react', 'node', 'javascript', 'typescript', 'frontend', 'backend', 'fullstack', 'api', 'devops', 'docker', 'kubernetes'],
  },
  {
    industry: 'FinTech',
    keywords: ['fintech', 'ngân hàng', 'bank', 'core banking', 'tài chính số', 'thanh toán', 'payment gateway'],
  },
  {
    industry: 'E-commerce',
    keywords: ['e-commerce', 'thương mại điện tử', 'checkout', 'giỏ hàng', 'shopify', 'magento'],
  },
  {
    industry: 'Healthcare',
    keywords: ['healthcare', 'y tế', 'medical', 'patient', 'hospital', 'clinic', 'chăm sóc sức khỏe'],
  },
  {
    industry: 'Education',
    keywords: ['edtech', 'education', 'học tập', 'elearning', 'trường học', 'sinh viên'],
  },
  {
    industry: 'Logistics',
    keywords: ['logistics', 'vận tải', 'supply chain', 'warehouse', 'kho vận'],
  },
  {
    industry: 'Real Estate',
    keywords: ['bất động sản', 'real estate', 'property', 'estate platform'],
  },
  {
    industry: 'Telecommunications',
    keywords: ['viễn thông', 'telecom', '5g', 'network operations'],
  },
];

export function detectIndustryFromJD(jdText: string): string | null {
  const haystack = jdText.toLowerCase();

  for (const rule of INDUSTRY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.industry;
    }
  }

  return null;
}

export { detectIndustryFromJD as detectIndustry };
