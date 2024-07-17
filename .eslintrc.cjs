module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'jsdoc', 'prettier', 'unicorn'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsdoc/recommended-typescript-flavor',
    'plugin:unicorn/recommended',
    'prettier',
  ],

  rules: {
    eqeqeq: ['error', 'always'],
    'unicorn/no-null': 'off',
    'unicorn/prefer-ternary': ['error', 'only-single-line'],
    'jsdoc/no-undefined-types': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns-description': 'off',
    'jsdoc/require-property-description': 'off',
    'prettier/prettier': [
      'warn',
      {
        semi: false,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
      },
    ],
  },
  overrides: [
    {
      files: '**/*.+(js|d.ts)',
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules', 'dist'],
}
