import { Messenger, SandboxMessage } from "./types";

export class IframeMessenger implements Messenger {
  private iframe: HTMLIFrameElement;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  subscribe(subscriber: (x: SandboxMessage) => void): () => void {
    const eventHandler = ({ data, origin, source }: MessageEvent<unknown>) => {
      if (origin !== "null" || source !== this.iframe.contentWindow) {
        return;
      }

      if (isFromSandbox(data)) {
        subscriber(data);
      }
    };

    window.addEventListener("message", eventHandler, false);

    return () => {
      window.removeEventListener("message", eventHandler);
    };
  }

  requestExecution(script: string) {
    this.postMessage({ type: "EXEC_CALL", script });
  }

  requestTermination() {
    this.postMessage({ type: "EXEC_TERMINATE" });
  }

  sendLibraryResult(result: unknown) {
    this.postMessage({ type: "LIB_RESULT", result });
  }

  private postMessage(message: unknown) {
    this.iframe.contentWindow?.postMessage(message, "*");
  }
}

const isFromSandbox = (x: any): x is SandboxMessage => {
  if (typeof x !== "object" || x === null) {
    return false;
  }

  switch (x.type) {
    case "INIT":
    case "TERMINATED": {
      return true;
    }

    case "LIB_CALL": {
      const path = Array.isArray(x.path);
      const args = Array.isArray(x.arguments);
      return path && args;
    }

    case "EXEC_RESULT": {
      const outputs = "outputs" in x;
      const error = x.error === null || typeof x.error === "string";
      return outputs && error;
    }
  }

  return false;
};
