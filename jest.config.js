module.exports = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/src/**/*.ts',
    '!packages/**/src/**/*.test.ts'
  ],
  projects: [{
    displayName: 'AuroraDataAPI',
    testMatch: ['<rootDir>/packages/aurora-data-api/src/**/*.test.ts'],
    preset: 'ts-jest'
  }, {
    displayName: 'DataAPILocal',
    testMatch: ['<rootDir>/packages/data-api-local/src/**/*.test.ts'],
    preset: 'ts-jest'
  }, {
    displayName: 'DataAPILocalServerless',
    testMatch: ['<rootDir>/packages/data-api-local-serverless/src/**/*.test.ts'],
    preset: 'ts-jest'
  }, {
    displayName: 'DataAPIMigrations',
    testMatch: ['<rootDir>/packages/data-api-migrations/src/**/*.test.ts'],
    preset: 'ts-jest'
  }, {
    displayName: 'DataAPIMigrationsServerless',
    testMatch: ['<rootDir>/packages/data-api-migrations-serverless/src/**/*.test.ts'],
    preset: 'ts-jest'
  }]
}
