import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "scripts/generate-levels-cli.ts",
    outDir: ".generated/generator",
    emptyOutDir: true,
    minify: false,
    target: "node20"
  }
});
