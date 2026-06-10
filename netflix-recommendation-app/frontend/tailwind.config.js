/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        netflixRed: '#E50914',
        darkBg: '#141414',
        cardBg: '#181818',
        cardHover: '#2F2F2F'
      }
    },
  },
  plugins: [],
}