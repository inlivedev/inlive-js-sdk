module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsdoc/recommended',
    'plugin:mocha/recommended',
    'plugin:prettier/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'jsdoc',
    'mocha',
    'prettier',
    'promise',
    'unicorn',
  ],
  rules: {
    'jsdoc/require-jsdoc': [
      'error',
      {
        publicOnly: false,
        require: {
          FunctionExpression: true,
          ArrowFunctionExpression: true,
          FunctionDeclaration: true,
          MethodDefinition: true,
        },
      },
    ],
  },
  ignorePatterns: ["node_modules", "dist", "./*.js"] //same patterns as "exclude" on tsconfig.json
}
