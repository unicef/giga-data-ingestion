import animate from "tailwindcss-animate";
import { fontFamily, fontSize } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        base: 16,
        ...fontSize,
      },
      fontFamily: {
        sans: ["Open Sans", ...fontFamily.sans],
      },
      colors: {
        "primary": "#277AFF",
        "secondary": "#B1D9FF",
        "success": "#52C41A",
        "warning": "#FAAD14",
        "error": "#FF4D4F",
        "terracotta": "#EE472F",
        "gray-1": "#3C3A3B",
        "gray-2": "#5F5D5E",
        "gray-3": "#858384",
        "gray-4": "#ACAAAB",
        "gray-5": "#F5F5F5",
        "gray-6": "#EDEDED",
      },
    },
  },
  plugins: [animate],
};
