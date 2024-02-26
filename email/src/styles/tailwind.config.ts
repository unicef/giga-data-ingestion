import { TailwindConfig } from "@react-email/components";

const config: TailwindConfig = {
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
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
      },
      colors: {
        primary: "#277AFF",
        secondary: "#B1D9FF",
        success: "#52C41A",
        warning: "#FAAD14",
        error: "#FF4D4F",
        terracotta: "#EE472F",
        "gray-1": "#3C3A3B",
        "gray-2": "#5F5D5E",
        "gray-3": "#858384",
        "gray-4": "#ACAAAB",
        "gray-5": "#F5F5F5",
        "gray-6": "#EDEDED",
        "giga-dark-pine-green": "#005757",
        "giga-light-pine-green": "#CDE3E1",
        "giga-green": "#46C66D",
        "giga-dark-green": "#00A044",
      },
    },
  },
};

export default config;
