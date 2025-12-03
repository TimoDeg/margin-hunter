/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        surface: '#020617',
        surfaceMuted: '#020617',
        borderSubtle: '#1f2937',
        accent: '#22c55e',
        accentSoft: '#064e3b',
      },
    },
  },
  plugins: [],
}


