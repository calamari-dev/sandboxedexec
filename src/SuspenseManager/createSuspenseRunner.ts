import { findLibrary } from "./findLibrary";
import type { Library, Result } from "../types";
import { Messenger } from "../messenger/types";
import { SuspenseRunner } from "./types";

interface Config {
  messenger: Messenger;
  library: Library;
}

export const createSuspenseRunner = (config: Config): SuspenseRunner => {
  const { messenger, library } = config;

  return (script: string, callback: (x: Result) => void) => {
    let done = false;

    const unsubscribe = messenger.subscribe(async (data) => {
      switch (data.type) {
        case "LIB_CALL": {
          const fn = findLibrary(library, data.path);

          try {
            if (fn) {
              const result = await Promise.resolve(fn(...data.arguments));
              if (!done) messenger.sendLibraryResult(result);
            } else {
              throw new Error(`Couldn't find "${data.path.join(".")}".`);
            }
          } catch (error) {
            if (!done) {
              const libraryError: string = error.toString();
              callback({ status: "Library Error", libraryError });
              unsubscribe();
              done = true;
            }
          }

          return;
        }

        case "EXEC_RESULT": {
          const { outputs, error } = data;
          callback({ status: "Executed", outputs, error });
          unsubscribe();
          done = true;
          return;
        }

        case "TERMINATED": {
          callback({ status: "Terminated" });
          unsubscribe();
          done = true;
          return;
        }
      }
    });

    messenger.requestExecution(script);

    return () => {
      if (!done) messenger.requestTermination();
    };
  };
};
