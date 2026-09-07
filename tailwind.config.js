/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#080c14',
        surface: {
          DEFAULT: '#0f172a',
          secondary: '#162032',
          card: '#111927',
          border: '#1e293b',
          hover: '#1e2d42',
        },
        telemetry: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          crimson: '#ef4444',
          violet: '#8b5cf6',
          pink: '#ec4899',
          blue: '#3b82f6',
          slate: '#64748b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.4)',
        'glow-crimson': '0 0 15px -3px rgba(239, 68, 68, 0.4)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.4)',
        'glow-violet': '0 0 15px -3px rgba(139, 92, 246, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
