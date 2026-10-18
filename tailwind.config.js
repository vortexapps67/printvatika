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
        /* `primary` is the brand green — printo-style. Carries action, links,
           prices and the cart button. */
        primary: {
          50: '#E6F6ED',
          100: '#C2EBD4',
          200: '#8FD9AD',
          300: '#5BC486',
          400: '#2EAE63',
          500: '#00A651', // brand green
          600: '#008F45',
          700: '#007A3B',
          800: '#006330',
          900: '#004D25',
          950: '#003318',
        },

        /* `ink` — neutrals for type and rules. */
        ink: {
          50: '#F7F7F8',
          100: '#ECECEE',
          200: '#D9D9DC',
          300: '#B8B8BD',
          400: '#8A8A92',
          500: '#6B6B73',
          600: '#4A4A52',
          700: '#33333A',
          800: '#1F1F24',
          900: '#14141A',
          950: '#0A0A0F',
        },

        /* Process inks — kept for the control strip accent. */
        press: {
          cyan: '#00A3E0',
          magenta: '#E5007E',
          yellow: '#FFB81C',
          key: '#0A0A0F',
        },

        /* Tinted washes for image tiles and category cards. */
        wash: {
          aqua: '#E6F6ED',
          mint: '#EAF7F0',
          sand: '#FFF8E8',
          sage: '#EDF9F3',
          haze: '#EEF3FF',
        },

        status: {
          pending: '#8A8A92',
          paid: '#00A3E0',
          confirmed: '#6366F1',
          printing: '#00A651',
          ready: '#7C3AED',
          transit: '#D97706',
          done: '#0F9D58',
          cancelled: '#DC2626',
        },
      },

      fontFamily: {
        /* Inter everywhere — clean, modern e-commerce sans. */
        display: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },

      boxShadow: {
        none: 'none',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        lift: '0 10px 30px -8px rgb(0 0 0 / 0.18)',
        menu: '0 8px 24px -4px rgb(0 0 0 / 0.12)',
        plate: '3px 3px 0 0 #0A0A0F',
        'plate-sm': '2px 2px 0 0 #0A0A0F',
        'plate-white': '3px 3px 0 0 #FFFFFF',
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
      },

      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        'fade-rise': 'fade-rise 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
