import typescript from "rollup-plugin-typescript2";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

export default {
  input: "./src/index.ts",
  output: [
    {
      file: "./dist/cjs/index.js",
      format: "cjs",
      plugins: [
        getBabelOutputPlugin({
          presets: [
            ["@babel/preset-env", { useBuiltIns: "entry", corejs: 3 }],
            "minify",
          ],
        }),
      ],
    },
    {
      file: "./dist/esm/index.js",
      format: "es",
      plugins: [
        getBabelOutputPlugin({
          presets: [
            ["@babel/preset-env", { useBuiltIns: "entry", corejs: 3 }],
            "minify",
          ],
        }),
      ],
    },
    {
      file: "./dist/umd/index.js",
      format: "esm",
      plugins: [
        getBabelOutputPlugin({
          presets: [
            ["@babel/preset-env", { useBuiltIns: "entry", corejs: 3 }],
            "minify",
          ],
          plugins: ["@babel/plugin-transform-modules-umd"],
        }),
      ],
    },
  ],
  plugins: [typescript()],
};
