module.exports = {
  preset: 'ts-jest',
  cache: true, // Explicitly enable caching
  maxWorkers: '50%', // Limit parallel workers to 50% of CPU cores
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/supabase$': '<rootDir>/src/lib/__mocks__/supabase.ts',
    '^src/lib/supabase$': '<rootDir>/src/lib/__mocks__/supabase.ts'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      // Add module setting to allow import.meta
      compilerOptions: {
        module: 'esnext',
      },
    }],
  },
  testMatch: [
    '**/*.test.{ts,tsx}',
    '**/__tests__/**/*.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@supabase/supabase-js|@supabase/realtime-js|@supabase/postgrest-js|@supabase/storage-js|@supabase/functions-js|@supabase/gotrue-js)/)'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '<rootDir>/tests/playwright/'],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true
};
