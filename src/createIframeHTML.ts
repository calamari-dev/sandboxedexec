import { Library } from "./types";
import { serialize } from "./serialize";
import { workerize } from "./workerize";

interface IframeArguments {
  sandboxId: string;
  output: string;
  library: Library;
  worker: boolean;
}

export const createIframeHTML = (args: IframeArguments) => {
  const script = createScript(args);
  return `<script>${
    args.worker ? workerize(args.sandboxId, script) : script
  }</script>`;
};

const createScript = ({
  sandboxId,
  output,
  library,
  worker,
}: IframeArguments) => `\
(() => {
  "use strict";

  const createId = () => {
    return Array(32)
      .fill(0)
      .map(() => ((Math.random() * 16) | 0).toString(16))
      .join("");
  };

  const deserialize = (library, path) => {
    const result = {};

    for (let key of Object.keys(library)) {
      const value = library[key];

      if (value === null) {
        result[key] = (...args) => ({
          sandboxId: "${sandboxId}",
          type: "LIB_CALL",
          path: [...path, key],
          arguments: args
        });
      } else {
        result[key] = deserialize(value, [...path, key]);
      }
    }

    return result;
  };

  const postMessage = (json) => {
    ${worker ? "self.postMessage(json);" : ""}
    ${!worker ? `window.parent.postMessage(json, "*");` : ""}
  };

  const global = ${worker ? "self" : "window"};
  const GeneratorFunction =   Object.getPrototypeOf(function* () {}).constructor;
  const libEntries = deserialize(${JSON.stringify(serialize(library))}, []);

  let generator = null;
  let contextId = createId();

  const executed = {
    sandboxId: "${sandboxId}",
    type: "EXEC_RESULT",
    result: {},
    error: null
  };

  const output = (name, target) => {
    executed.result[name] = target;
  };

  global.addEventListener("message", ({ data }) => {
    if (["EXEC_CALL", "LIB_RESULT"].every((x) => x !== data["type"])) {
      return;
    }

    if (data["type"] === "LIB_RESULT" && data["contextId"] !== contextId) {
      return;
    }

    if (data["type"] === "EXEC_CALL") {
      if (generator) {
        generator.return();
      }

      contextId = createId();
      executed.result = {};
      executed.error = null;

      try {
        const script = data.script;
        const gfn = new GeneratorFunction("${output}", ...Object.keys(libEntries), script);
        generator = gfn(output, ...Object.values(libEntries));
      } catch (error) {
        generator = null;
        executed.error = error.message;
        postMessage(JSON.stringify(executed));
      }
    }

    if (!generator) {
      return;
    }

    const result = data["type"] === "LIB_RESULT" ? data.result : undefined;

    try {
      const { value, done } = generator.next(result);
      const json = done ? executed : { ...value, contextId };
      postMessage(json);
    } catch (error) {
      executed.error = error.message;
      postMessage(executed);
    }
  }, false);

  ${!worker ? `postMessage({ sandboxId: "${sandboxId}", type: "INIT" });` : ""}
})();
`;
