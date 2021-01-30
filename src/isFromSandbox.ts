import type { SandboxMessage } from "./types";

export const isFromSandbox = (x: any): x is SandboxMessage => {
  if (typeof x !== "object" || x === null) {
    return false;
  }

  if (typeof x["sandboxId"] !== "string") {
    return false;
  }

  if (x["type"] === "INIT" || x["type"] === "TERMINATE") {
    return true;
  }

  if (x["type"] === "LIB_CALL") {
    const y = x["path"];
    const path = Array.isArray(y) && y.every((x) => typeof x === "string");
    const args = Array.isArray(x["arguments"]);
    return path && args;
  }

  if (x["type"] === "EXEC_RESULT") {
    const result = Object.keys(x["result"]).every((x) => typeof x === "string");
    const error = x["error"] === null || typeof x["error"] === "string";
    return result && error;
  }

  return false;
};
