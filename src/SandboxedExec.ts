import { createId } from "./createId";
import { createIframeHTML } from "./createIframeHTML";
import { createSuspenseRunner, SuspenseRunner } from "./createSuspenseRunner";
import { isFromSandbox } from "./isFromSandbox";
import type { Result, SandboxedExecConfig } from "./types";

interface Suspense {
  script: string;
  callback: (x: Result) => void;
}

export class SandboxedExec {
  readonly iframe: HTMLIFrameElement;
  readonly timeout?: number;

  private runSuspense: SuspenseRunner;
  private loaded: boolean = false;
  private queue: Set<Suspense> = new Set();
  private terminate: (() => void) | null = null;

  constructor({
    output = "output",
    library = {},
    timeout,
  }: SandboxedExecConfig = {}) {
    const iframe = document.createElement("iframe");
    const sandboxId = createId();
    const html = createIframeHTML({ sandboxId, output, library });

    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("srcdoc", html);
    iframe.setAttribute("style", "display: none;");

    this.iframe = iframe;
    this.timeout = timeout;
    this.runSuspense = createSuspenseRunner({ iframe, sandboxId, library });

    const eventHandler = async ({ origin, data }: MessageEvent<unknown>) => {
      if (origin !== "null") {
        return;
      }

      if (!isFromSandbox(data) || data.sandboxId !== sandboxId) {
        return;
      }

      if (data.type === "INIT") {
        this.loaded = true;
        this.startExecution();
        window.removeEventListener("message", eventHandler);
      }
    };

    window.addEventListener("message", eventHandler, false);
  }

  exec(script: string, callback: (x: Result) => void): () => void {
    const suspense = { script, callback };
    this.queue.add(suspense);

    if (this.loaded && this.queue.size === 0) {
      this.startExecution();
    }

    return () => {
      if (this.loaded && suspense === this.getCurrentSuspense()) {
        this.terminate?.();
      } else {
        this.queue.delete(suspense);
      }
    };
  }

  cancelAll() {
    this.queue.clear();
    this.terminate?.();
  }

  private getCurrentSuspense(): Suspense | null {
    const firstItem = this.queue.values().next();
    return firstItem.done ? null : firstItem.value;
  }

  private startExecution() {
    const suspense = this.getCurrentSuspense();

    if (!suspense) {
      return;
    }

    const terminate = this.runSuspense(suspense.script, (result) => {
      suspense.callback(result);
      this.queue.delete(suspense);
      this.startExecution();
    });

    this.terminate = terminate;

    if (this.timeout !== undefined) {
      window.setTimeout(terminate, this.timeout);
    }
  }
}
