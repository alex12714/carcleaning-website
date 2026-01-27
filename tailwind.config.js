/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4c0',
          200: '#fbc885',
          300: '#f9a64a',
          400: '#f78419',
          500: '#ee6b09',
          600: '#d24f06',
          700: '#ae3808',
          800: '#8b2d0e',
          900: '#73270f',
        },
      },
    },
  },
  plugins: [],
}
