import { ThemeConfig, theme as defaultTheme } from "antd";

const theme: ThemeConfig = {
  ...defaultTheme,
  algorithm: defaultTheme.defaultAlgorithm,
  components: {
    App: {
      fontSize: 16,
      fontFamily: ['"Open Sans"', "sans-serif"].join(", "),
    },
  },
};

export default theme;
