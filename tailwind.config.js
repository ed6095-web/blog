/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wavvy: {
          primary:   '#7C3AED',
          primary2:  '#8B5CF6',
          primary3:  '#A855F7',
          accent:    '#EC4899',
          accent2:   '#3B82F6',
          bgDark:    '#0F172A',
          bgLight:   '#F8FAFC',
          card:      '#1E293B',
          cardLight: '#FFFFFF',
          border:    '#334155',
          borderLight: '#E2E8F0',
          muted:     '#64748B',
          mutedLight:'#94A3B8',
        },
      },
      fontFamily: {
        inter:    ['Inter', 'sans-serif'],
        jakarta:  ['"Plus Jakarta Sans"', 'sans-serif'],
        grotesk:  ['"Space Grotesk"', 'sans-serif'],
        poppins:  ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'wavvy-gradient':  'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        'wavvy-gradient2': 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
        'wavvy-radial':    'radial-gradient(ellipse at top, #1e1b4b 0%, #0F172A 70%)',
      },
      animation: {
        'fade-up':        'fadeUp 0.6s ease-out forwards',
        'fade-in':        'fadeIn 0.4s ease-out forwards',
        'slide-down':     'slideDown 0.3s ease-out forwards',
        'pulse-slow':     'pulseSlow 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s ease infinite',
        'float':          'float 6s ease-in-out infinite',
        'shimmer':        'shimmer 1.5s infinite',
        'spin-slow':      'spin 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass':    '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        'glow':     '0 0 20px rgba(124, 58, 237, 0.4)',
        'glow-pink':'0 0 20px rgba(236, 72, 153, 0.4)',
        'card':     '0 4px 24px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.22)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
