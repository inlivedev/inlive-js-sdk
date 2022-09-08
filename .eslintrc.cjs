module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:jsdoc/recommended',
    'plugin:mocha/recommended',
    'plugin:prettier/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import', 'jsdoc', 'mocha', 'prettier', 'promise', 'unicorn'],
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
}
