/**
 * Test setup file for Jest
 * This file runs before each test suite
 */

// Import the mock adapter
require('./mocks');

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.MOTONET_COOKIE = 'test-motonet-cookie';
process.env.SRYHMA_COOKIE = 'test-sryhma-cookie';
process.env.GIGANTTI_COOKIE = 'test-gigantti-cookie';
process.env.REFRESH_INTERVAL = '0 */12 * * *';
process.env.MOTONET_COOKIE_MAX_AGE = '86400000';
process.env.SRYHMA_COOKIE_MAX_AGE = '86400000';
process.env.GIGANTTI_COOKIE_MAX_AGE = '86400000';

// Silence console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the fs module to avoid file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('{}'),
}));

// Global teardown
afterAll(() => {
  jest.clearAllMocks();
});
