/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#C96342',
        secondary: {
          dark: '#1F1E1D',
          light: '#262624',
        },
      },
    },
  },
  plugins: [],
};
