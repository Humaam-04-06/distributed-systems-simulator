/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        surface: {
          DEFAULT: '#11141d',
          card: '#131622',
          elevated: '#171b28',
          hover: '#1b2030',
          border: '#212638',
          'border-subtle': '#181d2a',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          DEFAULT: '#3b82f6',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#f43f5e',
          info: '#3b82f6',
          purple: '#8b5cf6',
          neutral: '#71717a',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glow-blue': '0 0 20px -5px rgba(59, 130, 246, 0.25)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.25)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.25)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.25)',
      },
    },
  },
  plugins: [],
};
