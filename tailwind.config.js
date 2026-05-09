/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hilex-cyan': '#00D8FF',
        'hilex-dark': '#020617',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
