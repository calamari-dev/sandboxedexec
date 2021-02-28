import { createSuspenseRunner } from "./createSuspenseRunner";
import { SandboxMessage, Messenger } from "../messenger/types";
import { MessengerMock } from "../messenger/MessengerMock";

describe("Suspense Management", () => {
  it("Full Execution", (done) => {
    const library = {
      add: (x: number, y: number) => x + y,
    };

    const messenger = new MessengerMock(function* () {
      const sum = yield { type: "LIB_CALL", path: ["add"], arguments: [1, 2] };
      yield { type: "EXEC_RESULT", outputs: { sum }, error: null };
    });

    const runSuspense = createSuspenseRunner({ messenger, library });

    runSuspense(`output("sum", yield add(1, 2))`, (result) => {
      expect(result).toEqual({
        status: "Executed",
        outputs: { sum: 3 },
        error: null,
      });

      done();
    });
  });

  it("Library Error", (done) => {
    const library = {
      error: () => {
        throw new Error();
      },
    };

    const messenger = new MessengerMock(function* () {
      yield { type: "LIB_CALL", path: ["error"], arguments: [] };
      yield { type: "EXEC_RESULT", outputs: {}, error: null };
    });

    const runSuspense = createSuspenseRunner({ messenger, library });

    runSuspense(`yield error()`, (result) => {
      expect(result.status).toBe("Library Error");
      done();
    });
  });

  it("Termination", (done) => {
    class MessengerMock implements Messenger {
      private subscriber: (x: SandboxMessage) => void = () => {};

      subscribe(subscriber: (x: SandboxMessage) => void) {
        this.subscriber = subscriber;
        return () => {};
      }

      requestTermination() {
        this.subscriber({ type: "TERMINATED" });
      }

      requestExecution() {}
      sendLibraryResult() {}
    }

    const runSuspense = createSuspenseRunner({
      messenger: new MessengerMock(),
      library: {},
    });

    const terminate = runSuspense(`while (1) {}`, (result) => {
      expect(result.status).toBe("Terminated");
      done();
    });

    terminate();
  });
});
