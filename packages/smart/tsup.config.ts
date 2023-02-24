import { defineConfig } from "tsup";

export default defineConfig({
  target: "esnext",
  dts: true,
  format: ["esm", "cjs"],
  entry: {
    core: "src/index.ts",
  },
});
