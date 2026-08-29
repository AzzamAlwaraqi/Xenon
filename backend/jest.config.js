module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  clearMocks: true,
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/mocks/uuid.js',
    '^firebase-admin$': '<rootDir>/tests/mocks/firebase.js'
  }
};
