import { MessengerMock } from "../messenger/MessengerMock";
import { SuspenseManager } from "./SuspenseManager";

it("Parallel Execution", async () => {
  const library = {
    add: (x: number, y: number) => x + y,
  };

  const messenger = new MessengerMock(function* () {
    const sum = yield { type: "LIB_CALL", path: ["add"], arguments: [1, 2] };
    yield { type: "EXEC_RESULT", outputs: { sum }, error: null };
  });

  const manager = new SuspenseManager({ messenger, library });

  await Promise.all([
    new Promise((resolve) => {
      manager.exec(`output("sum", yield add(1, 2))`, (result) => {
        expect(result).toEqual({
          status: "Executed",
          outputs: { sum: 3 },
          error: null,
        });
        resolve(null);
      });
    }),
    new Promise((resolve) => {
      manager.exec(`output("sum", yield add(1, 2))`, (result) => {
        expect(result).toEqual({
          status: "Executed",
          outputs: { sum: 3 },
          error: null,
        });
        resolve(null);
      });
    }),
  ]);
});

it("Serial Execution", async () => {
  const library = {
    add: (x: number, y: number) => x + y,
  };

  const messenger = new MessengerMock(function* () {
    const sum = yield { type: "LIB_CALL", path: ["add"], arguments: [1, 2] };
    yield { type: "EXEC_RESULT", outputs: { sum }, error: null };
  });

  const manager = new SuspenseManager({ messenger, library });

  await new Promise((resolve) => {
    manager.exec(`output("sum", yield add(1, 2))`, (result) => {
      expect(result).toEqual({
        status: "Executed",
        outputs: { sum: 3 },
        error: null,
      });
      resolve(null);
    });
  });

  await new Promise((resolve) => {
    manager.exec(`output("sum", yield add(1, 2))`, (result) => {
      expect(result).toEqual({
        status: "Executed",
        outputs: { sum: 3 },
        error: null,
      });
      resolve(null);
    });
  });
});
