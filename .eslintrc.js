module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'max-len': ['error', { code: 220 }],
    'no-underscore-dangle': 'off',
    'no-unused-expressions': 'off',
    'arrow-body-style': 'off',
    'import/prefer-default-export': 'off',
    'vue/require-valid-default-prop': 'off',
    'vue/no-unused-components': 'off',
    'vue/no-unused-vars': 'off',
    'vue/return-in-computed-property': 'off',
    'vue/no-use-v-if-with-v-for': 'off',
    'no-param-reassign': 'off',
    'consistent-return': 'off',
    'no-alert': 'off',
    'no-unused-vars': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'import/extensions': ['error', 'always', {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
      vue: 'never',
    }],
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
