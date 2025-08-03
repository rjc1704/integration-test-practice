module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  testEnvironmentOptions: {
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/testdb_test",
    },
  },
};
