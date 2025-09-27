// Todos direitos autorais reservados pelo QOTA.

/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: '#C89116',
        black: '#000000',
        white: '#ffffff',
        gold: '#C89116',
        'text-on-dark': '#ffffff',
        'text-on-light': '#000000',
        'text-on-gold': '#000000',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(to right, #C89116, #000000)',
        'gold-gradient-vertical': 'linear-gradient(to bottom, #C89116, #000000)',
        'gold-gradient-horizontal': 'linear-gradient(to right, #C89116, #000000)',
        'gold-gradient-diagonal': 'linear-gradient(to bottom right, #C89116, #000000)',
      },
    },
  },
  plugins: [],
}