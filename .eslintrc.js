module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  overrides: [
    {
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
    },
    {
      extends: ["eslint:recommended"],
      files: ["*.js"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {},
};
