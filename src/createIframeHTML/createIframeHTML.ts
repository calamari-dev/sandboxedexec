import { workerize } from "./workerize";
import { createWorkerScript } from "./createWorkerScript";
import type { Library } from "../types";

interface Config {
  output: string;
  library: Library;
}

export const createIframeHTML = (config: Config) => {
  const script = createWorkerScript(config);
  return `<script>${workerize(script)}</script>`;
};
