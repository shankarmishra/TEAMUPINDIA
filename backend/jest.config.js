module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/src/tests/globalSetup.js',
  globalTeardown: '<rootDir>/src/tests/globalTeardown.js',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 30000, // 30 seconds
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}; 