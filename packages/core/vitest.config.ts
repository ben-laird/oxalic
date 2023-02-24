import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    includeSource: ["src/**/*.{js,ts}"],
    coverage: { reporter: ["html-spa", "text"] },
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
