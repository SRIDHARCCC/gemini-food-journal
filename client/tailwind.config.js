/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gemini: {
          blue: "#1a73e8",
          purple: "#7c3aed",
          spark: "#4285f4",
          dark: "#1e1e24",
          surface: "#f8fafd",
        }
      }
    },
  },
  plugins: [],
}
