import { workerize } from "./workerize";
import { createWorkerScript } from "./createWorkerScript";
import type { Library } from "./types";

interface Config {
  sandboxId: string;
  output: string;
  library: Library;
}

export const createIframeHTML = (config: Config) => {
  const script = createWorkerScript(config);
  return `<script>${workerize({ ...config, script })}</script>`;
};
