/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      'emoji': ['Noto Color Emoji', 'Sergoe UI Emoji', 'Apple Color Emoji', 'sans-serif']
    },
    extend: {
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)',
      },
      height: {
        '128': '32rem',
        '144': '36rem',
      },
      screens: {
        desktop: { 'min': '701px' },
        // => @media (min-width: 701px) { ... }
        mobile: { 'max': '700px' },
        // => @media (max-width: 600px) { ... }
        xs: { 'max': '370px' }
        // => @media (max-width: 370px) { ... }
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
  ],
};
