/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Dark holographic duel-arena palette with neon accents.
      colors: {
        'spy-bg': '#05060D',      // near-black arena floor
        'spy-surface': '#0B0F1F', // deep panel
        'spy-card': '#111733',    // card body
        'spy-border': '#1C2A52',  // faint structural line (used sparingly)
        'spy-accent': '#22D3EE',  // cyan neon
        'spy-accent2': '#E879F9', // magenta neon
        'spy-danger': '#FB7185',  // rose neon
        'spy-success': '#34D399', // green neon
        'spy-warn': '#FBBF24',    // amber neon
        'spy-text': '#E6F0FF',    // bright ink
        'spy-muted': '#7C8AB0',   // muted steel
      },
      borderRadius: {
        '2xl': '1.1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        neon: '0 0 18px -2px rgba(34, 211, 238, 0.55), 0 0 4px rgba(34, 211, 238, 0.4)',
        'neon-strong':
          '0 0 32px -2px rgba(34, 211, 238, 0.75), 0 12px 30px -8px rgba(0, 0, 0, 0.8)',
        'neon-magenta': '0 0 22px -2px rgba(232, 121, 249, 0.6)',
      },
    },
  },
  plugins: [],
};
