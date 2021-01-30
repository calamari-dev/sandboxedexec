import type { Library } from "./types";
import { workerize } from "./workerize";
import { createWorkerScript } from "./createWorkerScript";

interface IframeArguments {
  sandboxId: string;
  output: string;
  library: Library;
}

export const createIframeHTML = (args: IframeArguments) => {
  const script = createWorkerScript(args);
  return `<script>${workerize({ ...args, script })}</script>`;
};
