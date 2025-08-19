module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  plugins: ['react', 'react-hooks', 'prettier'],
  rules: {
    // Prettier integration
    'prettier/prettier': 'off', // Disable prettier conflicts

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Disable prop-types for now
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'off',
    'react/jsx-key': 'error',
    'react/no-unused-state': 'off',
    'react/no-direct-mutation-state': 'error',
    'react/no-unescaped-entities': 'off',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off', // Too noisy for development

    // General JavaScript rules
    'no-unused-vars': 'off', // Too noisy during development
    'no-console': 'off', // Allow console for development
    'no-debugger': 'error',
    'no-alert': 'off',
    'no-var': 'error',
    'prefer-const': 'warn',
    'prefer-arrow-callback': 'off',
    'arrow-spacing': 'off',
    'object-shorthand': 'off',
    'prefer-template': 'off',

    // Code quality rules
    eqeqeq: ['warn', 'always'],
    curly: 'off',
    'brace-style': 'off',
    'comma-dangle': 'off', // Let prettier handle this
    semi: 'off',
    quotes: 'off',
    'no-case-declarations': 'off',

    // Import rules
    'no-duplicate-imports': 'warn',

    // Performance rules
    'no-loop-func': 'warn',
    'no-inner-declarations': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'comma-dangle': 'off',
        'prettier/prettier': 'off',
      },
    },
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['server/**/*.js'],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        'no-console': 'off', // Allow console in server code
      },
    },
  ],
};
