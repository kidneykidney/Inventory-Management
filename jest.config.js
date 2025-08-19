module.exports = {
  // Test environment setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@test-utils$': '<rootDir>/src/test-utils',
    '^@server-test-utils$': '<rootDir>/server/test-utils',
  },
  
  // File patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/server/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/server/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ]
    }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'server/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!server/server.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/test-utils/**',
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/components/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './server/routes/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './server/models/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
  ],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/server'],
  
  // Handle static assets and modules
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@testing-library|lucide-react)/)'
  ],
  
  // Verbose output
  verbose: true,
  
  // Global setup
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  // Projects configuration for multi-environment testing
  projects: [
    {
      displayName: 'Frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@test-utils$': '<rootDir>/src/test-utils',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/test-utils/fileMock.js',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(axios|@testing-library|lucide-react|recharts)/)'
      ],
    },
    {
      displayName: 'Backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/server/test-utils/setupTests.js'],
      moduleNameMapper: {
        '^@server/(.*)$': '<rootDir>/server/$1',
        '^@server-test-utils$': '<rootDir>/server/test-utils',
      },
    },
  ],
};