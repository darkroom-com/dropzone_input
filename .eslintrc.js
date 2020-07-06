module.exports = {
  parser: "babel-eslint",
  env: {
    browser: true,
    node: true,
    es2020: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module"
  },
  ignorePatterns: [
    "node_modules/**/*",
    "vendor/**/*",
    "public/packs*/**/*",
    "coverage/**/*"
  ],
  rules: {}
};
