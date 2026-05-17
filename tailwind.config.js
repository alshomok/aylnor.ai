/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        gold: {
          DEFAULT: 'var(--gold)',
          light: 'var(--gold-light)',
          dark: 'var(--gold-dark)',
        },
        'royal-blue': {
          DEFAULT: 'var(--royal-blue)',
          light: 'var(--royal-blue-light)',
          dark: 'var(--royal-blue-dark)',
        },
        navy: {
          DEFAULT: 'var(--navy)',
          card: 'var(--navy-card)',
          elevated: 'var(--navy-elevated)',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 0.25rem)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 0.25rem)',
        xl: 'calc(var(--radius) + 0.5rem)',
        '2xl': 'calc(var(--radius) + 1rem)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease forwards',
        'slide-up': 'slideUp 300ms ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 160, 23, 0.3), 0 0 40px rgba(212, 160, 23, 0.1)',
        'blue-glow': '0 0 20px rgba(27, 79, 216, 0.4), 0 0 40px rgba(27, 79, 216, 0.15)',
        'card-elevated': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};