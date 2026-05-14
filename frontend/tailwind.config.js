/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16a34a',
          50: '#f0fbf4',
          100: '#dbf6e6',
          200: '#bff0c9',
          300: '#88e49a',
          400: '#34d162',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532b',
          900: '#113f21'
        }
      }
    },
  },
  plugins: [],
};