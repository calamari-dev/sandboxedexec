import { createIframeHTML } from "./createIframeHTML";
import { IframeMessenger } from "./messenger";
import { SuspenseManager } from "./SuspenseManager";
import type { Result, SandboxedExecConfig } from "./types";

export class SandboxedExec {
  readonly iframe: HTMLIFrameElement;
  private suspenseManager: SuspenseManager;

  constructor({
    output = "output",
    library = {},
    timeout,
  }: SandboxedExecConfig = {}) {
    const iframe = document.createElement("iframe");
    const html = createIframeHTML({ output, library });
    const messenger = new IframeMessenger(iframe);

    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("srcdoc", html);
    iframe.setAttribute("style", "display: none;");

    this.iframe = iframe;
    this.suspenseManager = new SuspenseManager({ messenger, library, timeout });
  }

  exec(script: string, callback: (x: Result) => void): () => void {
    return this.suspenseManager.exec(script, callback);
  }

  stopAll() {
    this.suspenseManager.stopAll();
  }
}
