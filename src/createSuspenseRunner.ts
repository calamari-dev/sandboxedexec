import { findLibrary } from "./findLibrary";
import { isFromSandbox } from "./isFromSandbox";
import type { Library, Result, SuspenseRunner } from "./types";

interface Config {
  iframe: HTMLIFrameElement;
  sandboxId: string;
  library: Library;
}

export const createSuspenseRunner = (config: Config): SuspenseRunner => {
  const { iframe, sandboxId, library } = config;

  return (script: string, callback: (x: Result) => void) => {
    const { contentWindow } = iframe;
    let done = false;

    if (!contentWindow) {
      throw new Error("This iframe has not loaded yet.");
    }

    const eventHandler = async ({ origin, data }: MessageEvent<unknown>) => {
      if (origin !== "null") {
        return;
      }

      if (!isFromSandbox(data) || data.sandboxId !== sandboxId) {
        return;
      }

      switch (data.type) {
        case "LIB_CALL": {
          const fn = findLibrary(library, data.path);

          try {
            if (fn) {
              const result = await Promise.resolve(fn(...data.arguments));
              contentWindow.postMessage(libResult(result), "*");
            } else {
              throw new Error(`Couldn't find "${data.path.join(".")}".`);
            }
          } catch (error) {
            const libraryError: string = error.toString();
            window.removeEventListener("message", eventHandler);
            callback({ status: "Library Error", libraryError });
            done = true;
          }

          return;
        }

        case "EXEC_RESULT": {
          const { outputs, error } = data;
          window.removeEventListener("message", eventHandler);
          callback({ status: "Executed", outputs, error });
          done = true;
          return;
        }

        case "TERMINATED": {
          window.removeEventListener("message", eventHandler);
          callback({ status: "Terminated" });
          done = true;
          return;
        }
      }
    };

    contentWindow.postMessage(execCall(script), "*");
    window.addEventListener("message", eventHandler, false);

    return () => {
      !done && contentWindow.postMessage(terminate(), "*");
    };
  };
};

const execCall = (script: string) => ({
  type: "EXEC_CALL",
  script: script,
});

const libResult = (result: unknown) => ({
  type: "LIB_RESULT",
  result: result,
});

const terminate = () => ({
  type: "EXEC_TERMINATE",
});
