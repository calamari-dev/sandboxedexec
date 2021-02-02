import type { Messenger, SandboxMessage } from "./types";

export class MessengerMock implements Messenger {
  private gfn: () => Generator<SandboxMessage>;
  private generator: Generator<SandboxMessage> | null;
  private subscriber: Set<(x: SandboxMessage) => void>;

  constructor(gfn: () => Generator<SandboxMessage>) {
    this.gfn = gfn;
    this.generator = null;
    this.subscriber = new Set();
  }

  subscribe(subscriber: (x: SandboxMessage) => void) {
    this.subscriber.add(subscriber);
    window.setTimeout(() => subscriber({ type: "INIT" }), 10);
    return () => this.subscriber.delete(subscriber);
  }

  requestExecution() {
    this.generator = this.gfn();
    const result = this.generator.next();

    if (!result.done) {
      this.subscriber.forEach((fn) => fn(result.value));
    }
  }

  requestTermination() {
    this.subscriber.forEach((fn) => fn({ type: "TERMINATED" }));
  }

  sendLibraryResult(x: unknown) {
    const result = this.generator?.next(x);

    if (result && !result.done) {
      this.subscriber.forEach((fn) => fn(result.value));
    }
  }
}
