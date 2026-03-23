import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"]
        }
      }
    }
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "html"]
    }
  }
});
