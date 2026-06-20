/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        supporthr: {
          background: '#fafbfe',
          surface: '#ffffff',
          'surface-subtle': '#f8fbff',
          'surface-glass': 'rgba(255, 255, 255, 0.65)',
          border: '#e2e8f0',
          ink: '#0f172a',
          muted: '#475569',
          accent: '#2563eb',
          'accent-sky': '#0ea5e9',
          'accent-soft': '#dbeafe',
          'accent-sky-soft': '#e0f2fe',
        },
      },
      boxShadow: {
        'supporthr-card': '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'supporthr-float': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
      },
      maxWidth: {
        'supporthr-shell': '1440px',
        'supporthr-reading': '1120px',
      },
      animation: {
        'shimmer': 'shimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'scroll': 'scroll 25s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-100% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        },
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' }
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      backdropBlur: {
        xs: '2px',
        supporthr: '12px',
      },
      backgroundImage: {
        'supporthr-grid':
          'linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)',
        'supporthr-hero-glow':
          'radial-gradient(circle at top, rgba(37,99,235,0.12), transparent 34%), linear-gradient(180deg, #fafbfe 0%, #f3f7ff 54%, #ffffff 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
