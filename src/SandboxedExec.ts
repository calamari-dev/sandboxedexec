import { createId } from "./createId";
import { createIframeHTML } from "./createIframeHTML";
import { isFromSandbox } from "./isFromSandbox";
import { Library, Result, SandboxedExecConfig } from "./types";

export class SandboxedExec {
  readonly iframe: HTMLIFrameElement;
  onExecuted?: (x: Result) => unknown;
  onLibError?: (x: unknown) => unknown;

  private cue: unknown[] = [];
  private loaded: boolean = false;

  constructor({
    output = "output",
    library = {},
    worker = false,
  }: SandboxedExecConfig = {}) {
    this.iframe = document.createElement("iframe");

    const iframe = this.iframe;
    const sandboxId = createId();
    const html = createIframeHTML({ output, library, worker, sandboxId });

    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("srcdoc", html);
    iframe.setAttribute("style", "display: none;");

    window.addEventListener("message", ({ origin, data }) => {
      if (origin !== "null") {
        return;
      }

      if (!isFromSandbox(data) || data.sandboxId !== sandboxId) {
        return;
      }

      if (data.type === "INIT") {
        this.loaded = true;

        while (this.cue.length !== 0) {
          const json = this.cue.shift();
          iframe.contentWindow?.postMessage(json, "*");
        }

        return;
      }

      if (data.type === "EXEC_RESULT") {
        const json = { result: data.result, error: data.error };
        this.onExecuted?.(json);
        return;
      }

      const fn = find(library, data.path);

      if (fn) {
        try {
          Promise.resolve(fn(...data.arguments)).then((result) => {
            const { contextId } = data;
            const json = { type: "LIB_RESULT", result, contextId };
            this.postMessage(json);
          });
        } catch (error) {
          this.onLibError?.(error);
        }
      } else {
        this.onLibError?.(
          new Error(`Library ${data.path.join(".")} is not registered.`)
        );
      }
    });
  }

  execute(script: string) {
    const json = { type: "EXEC_CALL", script };
    this.postMessage(json);
  }

  terminate() {
    const json = { type: "EXEC_TERMINATE" };
    this.postMessage(json);
  }

  private postMessage(json: unknown) {
    if (this.loaded) {
      this.iframe.contentWindow?.postMessage(json, "*");
    } else {
      this.cue.push(json);
    }
  }
}

const find = (
  library: Library,
  path: string[]
): ((...x: any[]) => unknown) | null => {
  let parent: Library = library;

  for (let i = 0; i < path.length; i++) {
    const current = parent[path[i]];

    switch (typeof current) {
      case "function": {
        return current;
      }
      case "undefined": {
        return null;
      }
      case "object": {
        parent = current;
      }
    }
  }

  return null;
};
