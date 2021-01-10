import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "./src/index.ts",
    external: [/tslib/],
    output: [
      {
        file: "./dist/cjs/index.js",
        format: "cjs",
        exports: "auto",
      },
      {
        file: "./dist/esm/index.js",
        format: "es",
        exports: "auto",
      },
    ],
    plugins: [typescript()],
  },
  {
    input: "./src/index.ts",
    output: {
      file: "./dist/iife/index.js",
      format: "iife",
      name: "SandboxedExec",
      plugins: [terser({ format: { comments: () => false } })],
    },
    plugins: [typescript()],
  },
];
