import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: {
    core: "src/index.ts",
  },
});
