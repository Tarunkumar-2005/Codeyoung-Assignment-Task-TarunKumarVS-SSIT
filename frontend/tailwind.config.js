/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        cy: {
          yellow: {
            50: '#FFFDF5',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
          },
          navy: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
            950: '#020617',
          },
          teal: {
            50: '#F0FDFA',
            100: '#CCFBF1',
            500: '#14B8A6',
            600: '#0D9488',
            700: '#0F766E',
          },
        },
      },
      boxShadow: {
        'cy-sm': '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
        'cy-md': '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
        'cy-lg': '0 16px 32px -6px rgba(15, 23, 42, 0.12)',
        'cy-yellow': '0 8px 20px -4px rgba(245, 158, 11, 0.35)',
      },
    },
  },
  plugins: [],
}
