/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Realistic casino-felt table with ivory cards and warm wood/gold trim.
      colors: {
        'felt-900': '#0a3522',
        'felt-800': '#0d4a30',
        'felt-700': '#11603d',
        'spy-bg': '#0b3d27',       // felt base
        'spy-surface': '#0d3221',  // darker felt panel
        'spy-card': '#f6efdd',     // ivory card stock
        'spy-border': '#caa15a',   // gold trim
        'spy-accent': '#caa15a',   // gold
        'spy-accent2': '#1f7a4d',  // table green accent
        'spy-danger': '#c0392b',   // deep red
        'spy-success': '#2e8b57',  // felt-friendly green
        'spy-warn': '#d99a2b',     // amber
        'spy-text': '#f3eee0',     // light ink on felt
        'spy-muted': '#9cbcab',    // muted mint on felt
        'ink': '#26211a',          // dark text on ivory cards
        'ink-muted': '#6f6552',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.35rem',
        '4xl': '1.75rem',
      },
      boxShadow: {
        // Physical, grounded shadows for card thickness and table depth.
        card: '0 6px 14px -4px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.4)',
        'card-lg': '0 16px 34px -10px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.45)',
        token: '0 4px 10px -2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
      },
    },
  },
  plugins: [],
};
