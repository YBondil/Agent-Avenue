/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Bright, playful board-game palette. Token names kept stable; only the
      // values changed from the old dark theme to a luminous, jovial set.
      colors: {
        'spy-bg': '#FDF2E3',      // warm cream base (gradient applied in CSS)
        'spy-surface': '#FFFFFF', // panels and cards
        'spy-card': '#FFF9F0',    // soft tinted surface
        'spy-border': '#F1DDC2',  // warm soft border
        'spy-accent': '#6C5CE7',  // primary indigo
        'spy-accent2': '#00BCD4', // cyan
        'spy-danger': '#FF5C7A',  // coral
        'spy-success': '#10B981', // emerald
        'spy-warn': '#FF9F1C',    // amber
        'spy-text': '#39324F',    // ink
        'spy-muted': '#7E769A',   // muted purple-gray
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        playful: '0 8px 20px -6px rgba(108, 92, 231, 0.25)',
        card: '0 4px 12px -4px rgba(57, 50, 79, 0.18)',
      },
    },
  },
  plugins: [],
};
