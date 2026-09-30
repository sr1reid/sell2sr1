import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sr1: {
          dark: '#0a0f1d',
          navy: '#0f172a',
          card: '#131e36',
          border: '#1e293b',
          muted: '#64748b',
          red: '#dc2626',
          accent: '#2563eb',
          gold: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
};
export default config;
