module.exports = {
  "root": true,
  "extends": [
    'lxsmnsyc/typescript/solid',
  ],
  "parserOptions": {
    "project": "./tsconfig.eslint.json",
    "tsconfigRootDir": __dirname,
  },
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "off"
  }
};
