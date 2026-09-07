/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0d1b2a', // Main deep background
          900: '#1b263b', // Surface / cards / header
          800: '#23324a', // Elevated surface / hover
          700: '#415a77', // Borders / dividers / subtle buttons
          500: '#778da9', // Secondary text / icons / muted accent
          100: '#e0e1dd', // Platinum / primary text
        },
        background: '#0d1b2a',
        surface: {
          DEFAULT: '#1b263b',
          card: '#1b263b',
          elevated: '#223049',
          hover: '#283956',
          border: '#415a77',
          'border-subtle': '#2d3e58',
        },
        text: {
          primary: '#e0e1dd',
          secondary: '#778da9',
          muted: '#5c728e',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#778da9',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(13, 27, 42, 0.7)',
        elevated: '0 8px 30px -4px rgba(13, 27, 42, 0.9)',
      },
    },
  },
  plugins: [],
};
