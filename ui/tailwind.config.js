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
        "giga-blue": "#277AFF",
        "giga-dark-blue": "#0530AD",
        "secondary": "#D6E4FD",
        "giga-light-blue": "#D6E4FD",
        "warning": "#FF9F40",
        "giga-yellow": "#FF9F40",
        "giga-dark-yellow": "#F47F20",
        "giga-light-yellow": "#FFE3C9",
        "error": "#F94B4B",
        "giga-red": "#F94B4B",
        "giga-dark-red": "#CC1B2D",
        "giga-light-red": "#FFE5E5",
        "info": "#07706D",
        "giga-pine-green": "#07706D",
        "giga-dark-pine-green": "#005757",
        "giga-light-pine-green": "#CDE3E1",
        "giga-black": "#222222",
        "giga-dark-gray": "#474747",
        "giga-gray": "#9E9E9E",
        "giga-light-gray": "#F5F5F5",
        "giga-white": "#FFFFFF",
      },
    },
  },
  plugins: [animate],
  corePlugins: {
    preflight: false,
  },
};
