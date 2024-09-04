module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
