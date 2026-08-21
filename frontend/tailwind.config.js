/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0F1A',
        surface: '#111827',
        card: '#162133',
        primary: '#3B82F6',
        text: {
          main: '#F9FAFB',
          secondary: '#9CA3AF'
        },
        border: 'rgba(255, 255, 255, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
