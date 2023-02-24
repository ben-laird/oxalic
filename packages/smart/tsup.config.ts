import { defineConfig } from "tsup";

export default defineConfig({
  target: "esnext",
  dts: true,
  entry: {
    core: "src/index.ts",
  },
});
