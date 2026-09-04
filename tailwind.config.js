/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#82dbff', // User brand color 1 (light cyan)
          300: '#38bdf8',
          400: '#00b2ec', // User brand color 2 (vibrant cyan)
          500: '#0086be', // User brand color 3 (mid cyan)
          600: '#005c92', // User brand color 4 (deep cyan-blue)
          700: '#003457', // User brand color 5 (rich navy)
          850: '#021e34', // darker navy
          900: '#011526', // deepest navy
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0, 52, 87, 0.12)',
        'premium-hover': '0 20px 40px -15px rgba(0, 52, 87, 0.2)',
      }
    },
  },
  plugins: [],
};
