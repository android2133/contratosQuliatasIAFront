/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  safelist: [
    // Colores zinc usados dinámicamente en collection-manager
    'bg-zinc-950', 'bg-zinc-900', 'bg-zinc-800', 'bg-zinc-700', 'bg-zinc-600',
    'border-zinc-950', 'border-zinc-900', 'border-zinc-800', 'border-zinc-700', 'border-zinc-600',
    'text-zinc-100', 'text-zinc-200', 'text-zinc-300', 'text-zinc-400', 'text-zinc-500', 'text-zinc-600',
    // Emerald dinámico
    'text-emerald-300', 'text-emerald-400', 'text-emerald-500',
    'bg-emerald-900', 'bg-emerald-950',
    'border-emerald-500', 'border-emerald-800',
    // Cyan dinámico
    'text-cyan-300', 'text-cyan-400', 'text-cyan-500',
    'bg-cyan-900', 'bg-cyan-950', 'border-cyan-800',
    // Red dinámico
    'text-red-400', 'bg-red-950', 'border-red-800',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', "'Helvetica Neue'", 'sans-serif'],
      },
      colors: {
        // Paleta primaria — magenta corporativo (#941B80)
        accent: {
          50:  '#fff7fc',  // --color-primary-subtle
          100: '#EED7E7',  // --color-primary-light
          200: '#dbb0cc',
          300: '#c480b2',
          400: '#a85098',
          500: '#941B80',  // --color-primary
          600: '#7d1769',
          700: '#6f145f',  // --color-primary-dark
          800: '#521047',
          900: '#3a0b32',
        },
      },
      animation: {
        shimmer:       'shimmer 1.5s infinite',
        'shimmer-dark':'shimmerDark 1.8s infinite',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'slide-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)',
        'glow-pulse':  'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        shimmerDark: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16,185,129,0.08), 0 0 60px rgba(16,185,129,0.04)' },
          '50%':      { boxShadow: '0 0 40px rgba(16,185,129,0.18), 0 0 80px rgba(16,185,129,0.08)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
