module.exports = {
  arrowParens: "avoid",
  bracketSpacing: true,
  endOfLine: "lf",
  importOrder: ["^react(.*)", "<THIRD_PARTY_MODULES>", "@/(.*)", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  jsxSingleQuote: false,
  plugins: [
    import("@trivago/prettier-plugin-sort-imports"),
    import("prettier-plugin-tailwindcss"),
  ],
  quoteProps: "consistent",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
};
