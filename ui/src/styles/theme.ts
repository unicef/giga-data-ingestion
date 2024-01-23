import { ThemeConfig, theme as defaultTheme } from "antd";

const antdTheme: ThemeConfig = {
  ...defaultTheme,
  algorithm: defaultTheme.defaultAlgorithm,
  components: {
    App: {
      fontSize: 16,
      fontFamily: ['"Open Sans"', "sans-serif"].join(", "),
    },
    Breadcrumb: {
      linkColor: "#277AFF",
      lastItemColor: "#000000",
      linkHoverColor: "#277AFF",
    },
  },
};

export default antdTheme;
