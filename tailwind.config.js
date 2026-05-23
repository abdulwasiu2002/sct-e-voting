/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 24px 80px rgba(15, 23, 42, 0.18)",
      },
      colors: {
        sct: {
          navy: "#0f172a",
          blue: "#164e63",
          emerald: "#047857",
          gold: "#d97706",
        },
      },
    },
  },
  plugins: [],
};
