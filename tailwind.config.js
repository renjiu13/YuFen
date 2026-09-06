/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["themes/YuFen/layouts/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: "#1A1A1A",
        gray: {
          100: "#F8F8F8",
          200: "#E8E8E8",
          300: "#D0D0D0",
          400: "#999999",
          500: "#666666",
          600: "#333333",
        },
        light: "#FFFFFF",
      },
      fontFamily: {
        sans: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
