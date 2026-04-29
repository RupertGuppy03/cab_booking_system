/**
 * Student: Rupert Guppy (23196925)
 * File: tailwind.config.js
 * Description: Tailwind CSS configuration. Extends the palette with brand colours
 *              matching the Part 1 colour scheme.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#1a1a2e',
        'brand-dark': '#16213e',
      },
      fontFamily: {
        sans: ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
