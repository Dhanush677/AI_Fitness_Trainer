/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f6efe7",
        ember: "#ff6b35",
        mint: "#0f766e",
        navy: "#0f172a",
      },
      fontFamily: {
        body: ['"Outfit"', "sans-serif"],
        display: ['"Space Grotesk"', "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 60px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};
