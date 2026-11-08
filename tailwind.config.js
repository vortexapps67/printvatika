/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* `primary` — premium turquoise. Rich, sophisticated teal-turquoise
           that reads as trust + freshness. Carries action, links, prices. */
        primary: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4', // brand turquoise
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },

        /* `ink` — warm charcoal neutrals. */
        ink: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },

        /* Process inks — kept for the control strip accent. */
        press: {
          cyan: '#06B6D4',
          magenta: '#E5007E',
          yellow: '#FFB81C',
          key: '#0F172A',
        },

        /* Tinted washes for image tiles and category cards. */
        wash: {
          aqua: '#ECFEFF',
          mint: '#F0FDFA',
          sand: '#FFF8E8',
          sage: '#F0FDF4',
          haze: '#EEF2FF',
        },

        status: {
          pending: '#94A3B8',
          paid: '#06B6D4',
          confirmed: '#6366F1',
          printing: '#06B6D4',
          ready: '#7C3AED',
          transit: '#D97706',
          done: '#0F9D58',
          cancelled: '#DC2626',
        },
      },

      fontFamily: {
        /* Plus Jakarta Sans — premium, modern, geometric. Used for both
           display and body for a unified, polished look. */
        display: ['var(--font-sans)', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['var(--font-sans)', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        label: ['0.75rem', { lineHeight: '1.125rem' }],
        'body-s': ['0.8125rem', { lineHeight: '1.375rem' }],
        body: ['0.9375rem', { lineHeight: '1.625rem' }],
        'body-l': ['1.0625rem', { lineHeight: '1.75rem' }],
        lead: ['1.1875rem', { lineHeight: '1.75rem' }],
        'lead-l': ['1.375rem', { lineHeight: '1.875rem' }],
        title: ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        'title-l': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.015em' }],
        'display-s': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        display: ['2.75rem', { lineHeight: '3rem', letterSpacing: '-0.025em' }],
        'display-l': ['3.5rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em' }],
        'display-xl': ['4.5rem', { lineHeight: '4.25rem', letterSpacing: '-0.035em' }],
      },

      borderRadius: {
        none: '0',
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        full: '9999px',
      },

      boxShadow: {
        none: 'none',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.08)',
        lift: '0 12px 32px -8px rgb(0 0 0 / 0.18)',
        menu: '0 8px 24px -4px rgb(0 0 0 / 0.12)',
        glow: '0 0 20px 0 rgb(6 182 212 / 0.25)',
      },

      letterSpacing: {
        tightest: '-0.035em',
        wider2: '0.14em',
      },

      maxWidth: {
        sheet: '88rem',
      },

      transitionTimingFunction: {
        press: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'fade-rise': 'fade-rise 0.4s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        'slide-up': 'slide-up 0.5s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
