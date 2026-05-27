/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hotpink: {
          DEFAULT: '#FF1493',
          50: '#FFE5F2',
          100: '#FFCCE5',
          200: '#FF99CC',
          300: '#FF66B2',
          400: '#FF3399',
          500: '#FF1493',
          600: '#E60082',
          700: '#B30066',
          800: '#80004A',
          900: '#4D002D',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-pink': 'pulse-pink 2s ease-in-out infinite',
        'scroll-marquee': 'scroll-marquee 30s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px #FF1493, 0 0 20px #FF1493' },
          '100%': { boxShadow: '0 0 20px #FF1493, 0 0 40px #FF1493, 0 0 60px #FF1493' },
        },
        'pulse-pink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'scroll-marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
