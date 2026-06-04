import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Noto Naskh Arabic', 'Traditional Arabic', 'serif'],
        ui: ['Baloo 2', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#58CC02',
          dark: '#46A302',
          light: '#89E219',
        },
        hearts: '#FF4B4B',
        xp: '#FFC800',
        sky: '#1CB0F6',
        correct: '#58CC02',
        wrong: '#FF4B4B',
        surface: '#F7F7F7',
        card: '#FFFFFF',
        border: '#E5E5E5',
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'float-up': 'floatUp 1.2s ease-out forwards',
        'shake': 'shake 0.4s ease-in-out',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
        'heart-break': 'heartBreak 0.4s ease-in-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.3)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-60px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-10px)' },
          '40%': { transform: 'translateX(10px)' },
          '60%': { transform: 'translateX(-10px)' },
          '80%': { transform: 'translateX(10px)' },
        },
        pulseRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.9' },
        },
        heartBreak: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
