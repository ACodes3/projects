
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    include: ["tests/**/*.test.js"],

    setupFiles: ["./tests/setup.js"],

    testTimeout: 10000,

    // Run test files sequentially
    fileParallelism: false,

    // Use a single worker process
    pool: "forks",

    maxWorkers: 1,
    minWorkers: 1,
  },
});
