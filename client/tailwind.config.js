/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'spy-bg': '#0a0e1a',
        'spy-surface': '#111827',
        'spy-card': '#1a2236',
        'spy-border': '#2a3a5e',
        'spy-accent': '#3b82f6',
        'spy-accent2': '#6366f1',
        'spy-danger': '#ef4444',
        'spy-success': '#22c55e',
        'spy-warn': '#f59e0b',
        'spy-text': '#e2e8f0',
        'spy-muted': '#64748b',
      },
    },
  },
  plugins: [],
};
