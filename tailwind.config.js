/* eslint-disable no-undef */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: '#E2AA44',
        black: '#000000',
        gold: '#E2AA44',
        white: '#ffffff',
        'text-on-dark': '#ffffff',
        'text-on-light': '#000000',
        'text-on-gold': '#000000',
      },
    },
  },
  plugins: [],
}
