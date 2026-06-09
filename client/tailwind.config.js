/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Night-city / spy-dossier theme: deep navy, blueprint cyan, manila accent.
      colors: {
        'spy-bg': '#0b1220',      // night city base
        'spy-surface': '#13203a', // panel
        'spy-card': '#16233f',    // raised surface
        'spy-border': '#2a3c5e',  // structural line
        'spy-accent': '#e8c170',  // manila / dossier amber
        'spy-accent2': '#4aa3df', // blueprint cyan
        'spy-danger': '#e0556a',
        'spy-success': '#3fb27f',
        'spy-warn': '#e8a23a',
        'spy-text': '#e8eefb',
        'spy-muted': '#8aa0c4',
        'ink': '#1b2336',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.35rem',
        '4xl': '1.75rem',
      },
      boxShadow: {
        card: '0 8px 18px -6px rgba(0,0,0,0.7), 0 2px 5px rgba(0,0,0,0.5)',
        'card-lg': '0 20px 40px -12px rgba(0,0,0,0.8), 0 6px 12px rgba(0,0,0,0.5)',
        token: '0 4px 10px -2px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
      },
    },
  },
  plugins: [],
};
