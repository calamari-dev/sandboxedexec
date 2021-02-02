import { createSuspenseRunner } from "./createSuspenseRunner";
import type { Result, Library } from "../types";
import type { Messenger } from "../messenger";
import type { Suspense, SuspenseRunner } from "./types";

interface Config {
  messenger: Messenger;
  library: Library;
  timeout?: number;
}

export class SuspenseManager {
  private timeout: number | undefined;
  private loaded: boolean = false;
  private queue: Set<Suspense> = new Set();
  private terminate: (() => void) | null = null;
  private runSuspense: SuspenseRunner;

  constructor({ messenger, library, timeout }: Config) {
    this.timeout = timeout;
    this.runSuspense = createSuspenseRunner({ messenger, library });

    const unsubscribe = messenger.subscribe((data) => {
      if (data.type === "INIT") {
        this.loaded = true;
        this.startExecution();
        unsubscribe();
      }
    });
  }

  exec(script: string, callback: (x: Result) => void): () => void {
    const suspense = { script, callback };
    this.queue.add(suspense);

    if (this.loaded && this.queue.size === 1) {
      this.startExecution();
    }

    return () => {
      if (!this.queue.has(suspense)) {
        return;
      }

      if (this.loaded && suspense === this.getCurrentSuspense()) {
        this.queue.delete(suspense);
        this.terminate?.();
      } else {
        this.queue.delete(suspense);
        suspense.callback({ status: "Revoked" });
      }
    };
  }

  stopAll() {
    const current = this.getCurrentSuspense();

    if (current) {
      this.queue.delete(current);
    }

    this.queue.forEach(({ callback }) => {
      callback({ status: "Revoked" });
    });

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
