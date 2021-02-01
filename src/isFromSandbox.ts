import { SandboxMessage } from "./types";

export const isFromSandbox = (x: any): x is SandboxMessage => {
  if (typeof x !== "object" || x === null) {
    return false;
  }

  if (typeof x.sandboxId !== "string") {
    return false;
  }

  switch (x.type) {
    case "INIT":
    case "TERMINATED": {
      return true;
    }

    case "LIB_CALL": {
      const y = x.path;
      const path = Array.isArray(y) && y.every((x) => typeof x === "string");
      const args = Array.isArray(x.arguments);
      return path && args;
    }

    case "EXEC_RESULT": {
      const outs = Object.keys(x.outputs).every((x) => typeof x === "string");
      const error = x.error === null || typeof x.error === "string";
      return outs && error;
    }
  }

  return false;
};
