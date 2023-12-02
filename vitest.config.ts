import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  plugins: [react()],
  resolve: {
    alias: {
      "src/": resolve(__dirname, "./src/"),
      "~": resolve(__dirname, "./src/"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./__tests__/vitest.setup.ts"],
  },

  root: resolve(__dirname, "./"),
});
