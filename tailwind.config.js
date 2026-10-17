/**
 * Print Vatika — design tokens
 *
 * Palette: turquoise carries action, the way a spot ink carries a brand.
 * Surfaces are "stock" (paper), type is "ink" (black), and the process inks
 * survive only where they mean something — the CMYK control strip and the
 * ink legend, which are press iconography rather than chrome.
 *
 * The turquoise ramp is picked for contrast, not just for hue: step 500 is
 * the action fill and holds 4.9:1 against white, steps 300–400 are the
 * bright accents that sit on near-black, and 50–200 are the tints used for
 * washes and chips. Change a value here and every button, badge, ring and
 * link follows.
 *
 * Structure: image-forward and browsable, the way online print shops actually
 * work — products lead with a picture and a starting price, categories are
 * always one click away, and cards are soft enough to invite a click rather
 * than hairlined like a spec sheet.
 */
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
        /* `primary` is the ACTION colour only: brand turquoise.
           Kept under the old name so every existing primary-* call site
           lands on the new brand automatically. */
        primary: {
          50: '#ECFCFD',
          100: '#D2F6F9',
          200: '#A8EDF2',
          300: '#74E0E8',
          400: '#35CBD8',
          500: '#0B7C8A', // brand turquoise — 4.9:1 on white
          600: '#0A6B78',
          700: '#0A5D6A',
          800: '#0C4A55',
          900: '#0E3B44',
          950: '#0A2A31',
        },

        /* `ink` replaces slate everywhere: neutrals for type and rules. */
        ink: {
          50: '#F4F4F5',
          100: '#E8E9EB',
          200: '#D3D5D9',
          300: '#B0B4BA',
          400: '#858A93',
          500: '#63676F',
          600: '#484C53',
          700: '#34373D',
          800: '#22242A',
          900: '#141519',
          950: '#0B0B0C', // key black
        },

        /* The process inks. The control strip that runs under the navbar and
           over the footer uses cyan, the brand turquoise and yellow, so the
           chrome stays on-brand; process magenta survives as a token for
           artwork mock-ups rather than as UI. */
        press: {
          cyan: '#00A3E0',
          magenta: '#E5007E',
          yellow: '#FFB81C',
          key: '#0B0B0C',
        },

        /* Tinted washes for image tiles and category cards — five pastel
           stocks, named for what they are rather than for a hue, so the set
           outlives any rebrand. Nothing here is brand colour. */
        wash: {
          aqua: '#E4F8FB',
          mint: '#E7FAF6',
          sand: '#FFF8E8',
          sage: '#EDF9F3',
          haze: '#EEF3FF',
        },

        /* Order-status ramp, so status colour means one thing site-wide. */
        status: {
          pending: '#858A93',
          paid: '#00A3E0',
          confirmed: '#6366F1',
          printing: '#0B7C8A',
          ready: '#7C3AED',
          transit: '#D97706',
          done: '#0F9D58',
          cancelled: '#DC2626',
        },
      },

      fontFamily: {
        /* Display: Fraunces — a soft-contrast variable serif. It carries the
           banners, product names and prices, and reads as print rather than
           as another SaaS grotesque. */
        display: ['var(--font-display)', 'Georgia', 'ui-serif', 'serif'],
        /* Body: Manrope — geometric, quiet at small sizes, with a warm
           edge that holds up next to the serif. */
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        /* Specs and data: JetBrains Mono — every measurement, price and
           order reference. */
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        /* Legacy alias, kept off any decorative serif so nothing can sneak a
           third display face into the page. */
        serif: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      /* Named type scale. Smallest step is 11px; body is 15px.
         Nothing between 12px and 15px exists, so body copy can't drift small. */
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

      /* Rounded enough to read as a card you can click, still tight enough to
         feel like print rather than a toy. The hairline rules do the work that
         heavy borders used to. */
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        full: '9999px',
      },

      /* Soft elevation for cards and menus. `plate` stays as the one hard
         offset shadow, reserved for a single element per viewport. */
      boxShadow: {
        none: 'none',
        card: '0 1px 2px 0 rgb(11 11 12 / 0.04), 0 4px 12px -2px rgb(11 11 12 / 0.07)',
        'card-hover':
          '0 2px 4px 0 rgb(11 11 12 / 0.05), 0 12px 28px -6px rgb(11 11 12 / 0.14)',
        lift: '0 8px 24px -6px rgb(11 11 12 / 0.18)',
        menu: '0 4px 6px -1px rgb(11 11 12 / 0.07), 0 12px 28px -8px rgb(11 11 12 / 0.16)',
        plate: '3px 3px 0 0 #0B0B0C',
        'plate-sm': '2px 2px 0 0 #0B0B0C',
        'plate-turquoise': '3px 3px 0 0 #0B7C8A',
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
        /* The colour control strip sliding into register. */
        register: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        /* Registration crosshair winding into place. */
        'spin-in': {
          '0%': { transform: 'rotate(-90deg)', opacity: '0' },
          '100%': { transform: 'rotate(0deg)', opacity: '1' },
        },
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        register: 'register 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'spin-in': 'spin-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'fade-rise': 'fade-rise 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};