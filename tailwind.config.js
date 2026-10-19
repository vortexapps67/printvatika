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
        /* `primary` — the press red. A deep vermillion: the classic ink of a
           working print shop, warm against the cream paper and never neon.
           Carries action, links, prices and the cart button. */
        primary: {
          50: '#FDF3EE',
          100: '#FAE2D7',
          200: '#F3C4AE',
          300: '#E89C7C',
          400: '#D96E45',
          500: '#C24A24', // brand vermillion
          600: '#A93E1D',
          700: '#8C3319',
          800: '#6E2914',
          900: '#501E0F',
          950: '#35140A',
        },

        /* `ink` — warm charcoal neutrals, one family, slight orange undertone
           so it sits with the paper rather than against it. */
        ink: {
          50: '#FAF8F4',
          100: '#F1EDE5',
          200: '#E2DCD0',
          300: '#C9C1B2',
          400: '#A79D8A',
          500: '#6F6353',
          600: '#665E50',
          700: '#4B4439',
          800: '#33302A',
          900: '#211F1B',
          950: '#16140F',
        },

        /* Press inks — kept for the CMYK control strip accent. */
        press: {
          cyan: '#00A3E0',
          magenta: '#E5007E',
          yellow: '#FFB81C',
          key: '#16140F',
        },

        /* Tinted washes for image tiles and category cards. */
        wash: {
          aqua: '#EAF3F4',
          mint: '#EDF4EB',
          sand: '#F8F1E7',
          sage: '#EFF4EC',
          haze: '#F1EEF6',
        },

        status: {
          pending: '#A79D8A',
          paid: '#00A3E0',
          confirmed: '#6366F1',
          printing: '#C24A24',
          ready: '#7C3AED',
          transit: '#D97706',
          done: '#0F9D58',
          cancelled: '#DC2626',
        },
      },

      fontFamily: {
        /* Fraunces — a warm, contemporary old-style serif for display.
           Outfit — geometric humanist sans for UI. IBM Plex Mono for the
           spec-sheet voice (prices, SKUs, labels). */
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
      },

      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        label: ['0.75rem', { lineHeight: '1.125rem' }],
        'body-s': ['0.8125rem', { lineHeight: '1.375rem' }],
        body: ['0.9375rem', { lineHeight: '1.625rem' }],
        'body-l': ['1.0625rem', { lineHeight: '1.75rem' }],
        lead: ['1.1875rem', { lineHeight: '1.75rem' }],
        'lead-l': ['1.375rem', { lineHeight: '1.875rem' }],
        title: ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'title-l': ['1.875rem', { lineHeight: '2.125rem', letterSpacing: '-0.015em' }],
        'display-s': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        display: ['2.75rem', { lineHeight: '2.875rem', letterSpacing: '-0.025em' }],
        'display-l': ['3.5rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em' }],
        'display-xl': ['4.5rem', { lineHeight: '4.25rem', letterSpacing: '-0.035em' }],
      },

      borderRadius: {
        none: '0',
        xs: '3px',
        sm: '6px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px',
      },

      boxShadow: {
        none: 'none',
        card: '0 1px 2px 0 rgb(22 20 15 / 0.05), 0 1px 3px 0 rgb(22 20 15 / 0.05)',
        'card-hover': '0 6px 16px -4px rgb(22 20 15 / 0.14), 0 2px 6px -2px rgb(22 20 15 / 0.07)',
        lift: '0 14px 40px -10px rgb(22 20 15 / 0.22)',
        menu: '0 10px 32px -6px rgb(22 20 15 / 0.16)',
        plate: '3px 3px 0 0 #16140F',
        'plate-sm': '2px 2px 0 0 #16140F',
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
