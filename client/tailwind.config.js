/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx}",
    "!./src/components/folders/**/*.{js,jsx}",
    "!./src/components/send/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}