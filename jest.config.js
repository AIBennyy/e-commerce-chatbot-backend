module.exports = {
  // Tell Jest to look for test files in the tests directory
  testMatch: ['**/tests/**/*.test.js'],
  
  // Set up test environment
  testEnvironment: 'node',
  
  // Configure coverage reporting
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server.js',
    'dashboard-api.js',
    'error-monitoring.js',
    'platform-adapters/**/*.js',
    'cookie-management-system/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Configure test timeouts
  testTimeout: 10000,
  
  // Set up global test setup
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Configure test reporting
  reporters: ['default', 'jest-junit'],
  
  // Configure test coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
