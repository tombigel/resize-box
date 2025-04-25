module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // Add any other plugins like prettier if used
  ],
  ignorePatterns: ['dist', 'build', '.eslintrc.cjs', 'vite*.config.ts', 'scripts/*.ts'],
  parser: '@typescript-eslint/parser',
  plugins: [
    // Add any other plugins like react-refresh if used
    '@typescript-eslint'
  ],
  rules: {
    // Add specific rule overrides here if needed
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }
    ],
    '@typescript-eslint/no-explicit-any': 'warn'
  },
};
