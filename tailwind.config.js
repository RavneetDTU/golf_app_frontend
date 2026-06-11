/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.js',
    './components/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        white: '#FFFFFF',
        'off-white': '#F8F9FA',
        black: '#0A0A0A',
        'green-dark': '#1B4332',
        'green-mid': '#2D6A4F',
        'green-light': '#D8F3DC',
        'grey-light': '#E9ECEF',
        'grey-mid': '#6C757D',
        'red-soft': '#FF6B6B',
        gold: '#C9A84C',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
