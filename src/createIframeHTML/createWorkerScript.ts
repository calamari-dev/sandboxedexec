import { serializeLibrary } from "./serializeLibrary";
import type { Library } from "../types";

interface Config {
  output: string;
  library: Library;
}

export const createWorkerScript = ({ output, library }: Config) => `\
(() => {
  "use strict";
  const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
  const deserialize = (library, path = []) => {
    const deserialized = {};

    for (let key of Object.keys(library)) {
      const value = library[key];

      if (value === null) {
        deserialized[key] = (...args) => ({
          type: "LIB_CALL",
          path: [...path, key],
          arguments: args
        });
      } else {
        deserialized[key] = deserialize(value, [...path, key]);
      }
    }

    return deserialized;
  };

  const libEntries = deserialize(${JSON.stringify(serializeLibrary(library))});
  const execResult = { type: "EXEC_RESULT", outputs: {}, error: null };
  let generator = null;

  const output = (name, target) => {
    execResult.outputs[name] = target;
  };

  self.addEventListener("message", ({ data }) => {
    if (["EXEC_CALL", "LIB_RESULT"].every((x) => x !== data.type)) {
      return;
    }

    if (data.type === "EXEC_CALL") {
      execResult.outputs = {};
      execResult.error = null;

      try {
        const { script } = data;
        const gfn = new GeneratorFunction("${output}", ...Object.keys(libEntries), script);
        generator = gfn(output, ...Object.values(libEntries));
      } catch (error) {
        generator = null;
        execResult.error = error.toString();
        self.postMessage(execResult);
      }
    }

    if (!generator) {
      return;
    }

    const result = data.type === "LIB_RESULT" ? data.result : undefined;

    try {
      const { value, done } = generator.next(result);
      self.postMessage(done ? execResult : value);
    } catch (error) {
      execResult.error = error.toString();
      self.postMessage(execResult);
    }
  }, false);
})();
`;
