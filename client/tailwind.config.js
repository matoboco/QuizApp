/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#00f0ff',
          500: '#00d4e6',
          600: '#00b8cc',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        cyber: {
          dark: '#0a0a1a',
          surface: '#12122a',
          card: '#1a1a3e',
          elevated: '#222255',
        },
        neon: {
          pink: '#ff2d8a',
          'pink-light': '#ff6eb4',
          'pink-dark': '#cc1a6e',
          green: '#39ff14',
          'green-light': '#7aff5c',
          'green-dark': '#2bcc10',
          purple: '#bf00ff',
          'purple-light': '#d966ff',
          'purple-dark': '#9900cc',
          yellow: '#ffe600',
        },
        answer: {
          red: '#ff1744',
          blue: '#2979ff',
          yellow: '#ffea00',
          green: '#00e676',
          purple: '#d500f9',
          orange: '#ff6d00',
          teal: '#00e5ff',
          pink: '#ff4081',
        },
        game: {
          bg: '#0a0a1a',
          surface: '#12122a',
          card: '#1a1a3e',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0,240,255,0.5), 0 0 30px rgba(0,240,255,0.2)',
        'neon-pink': '0 0 15px rgba(255,45,138,0.5), 0 0 30px rgba(255,45,138,0.2)',
        'neon-green': '0 0 15px rgba(57,255,20,0.5), 0 0 30px rgba(57,255,20,0.2)',
        'neon-purple': '0 0 15px rgba(191,0,255,0.5), 0 0 30px rgba(191,0,255,0.2)',
        'neon-yellow': '0 0 15px rgba(255,230,0,0.5), 0 0 30px rgba(255,230,0,0.2)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'score-pop': 'scorePop 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in forwards',
        'modal-fade-in': 'modalFadeIn 0.2s ease-out',
        'modal-fade-out': 'modalFadeOut 0.2s ease-in forwards',
        'modal-scale-in': 'modalScaleIn 0.2s ease-out',
        'modal-scale-out': 'modalScaleOut 0.2s ease-in forwards',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scorePop: {
          '0%': { transform: 'scale(0) translateY(0)', opacity: '1' },
          '50%': { transform: 'scale(1.2) translateY(-20px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-40px)', opacity: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        modalFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        modalFadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        modalScaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        modalScaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
