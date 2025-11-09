module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['import'],
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json'],
      },
    },
    'import/core-modules': ['swagger-jsdoc', 'swagger-ui-express', '@sentry/node', 'k6', 'k6/http', 'k6/metrics'],
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'import/no-unresolved': ['error', { ignore: ['^node:'] }],
    'import/export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'always',
        mjs: 'always',
      },
    ],
    'no-whitespace-before-property': 'error',
    'object-curly-spacing': ['warn', 'always'],
    quotes: ['warn', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
    semi: ['error', 'always'],
    'prefer-const': 'warn',
  },
  overrides: [
    {
      files: ['src/tests/**/*.js', '__tests__/**/*.js'],
      env: {
        jest: true,
      },
    },
    {
      files: ['src/public/**/*.js'],
      env: {
        browser: true,
        node: false,
      },
      globals: {
        Chart: 'readonly',
        io: 'readonly',
      },
    },
    {
      files: ['**/*.js'],
      rules: {
        'import/no-named-as-default': 0,
        'import/no-named-as-default-member': 0,
      },
    },
    {
      files: ['src/tests/performance/**/*.js'],
      globals: {
        __ENV: 'readonly',
      },
    },
  ],
};
