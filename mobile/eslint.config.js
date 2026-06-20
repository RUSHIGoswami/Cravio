const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        test: "readonly",
        expect: "readonly",
        require: "readonly",
        module: "readonly",
      },
    },
  },
];
