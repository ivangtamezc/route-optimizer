/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './frontend/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#22C55E',
        secondary: '#2563EB',
        bgLight: '#F1F5F9',
        textDark: '#0F172A',
      },
      borderRadius: {
        xl: '16px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}