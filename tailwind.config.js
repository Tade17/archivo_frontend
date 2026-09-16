/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          300: '#93c5fd',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          950: '#172554',
        },
      },
    },
  },
  plugins: [],
};
