import SandboxedExec from "../src";

const timeout = (result: unknown, timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(result);
    }, timeout);
  });
};

const library = {
  syncLibrary: {
    shift: (x: number[]) => {
      return [...x.slice(1), x[0]];
    },
    isPythagorean: ([x, y, z]: [number, number, number]) => {
      return x ** 2 + y ** 2 === z ** 2;
    },
  },
  asyncLibrary: () => {
    return timeout("Resolved", 100);
  },
  libraryError: () => {
    throw new Error("B");
  },
};

const spec = {
  syncExecution: (sandbox: SandboxedExec, output: string) => {
    const script =
      `${output}("shifted", yield syncLibrary.shift([3, 1, 2]));` +
      `${output}("answer", yield syncLibrary.isPythagorean([3, 4, 5]));`;

    return new Promise((resolve) => {
      sandbox.exec(script, (result) => {
        expect(result).toEqual({
          status: "Executed",
          outputs: { shifted: [1, 2, 3], answer: true },
          error: null,
        });

        resolve(null);
      });
    });
  },

  asyncExecution: (sandbox: SandboxedExec, output: string) => {
    const script = `${output}("promise", yield asyncLibrary());`;

    return new Promise((resolve) => {
      sandbox.exec(script, (result) => {
        expect(result).toEqual({
          status: "Executed",
          outputs: { promise: "Resolved" },
          error: null,
        });

        resolve(null);
      });
    });
  },

  termination: (sandbox: SandboxedExec) => {
    return new Promise((resolve) => {
      sandbox.exec(`while (1);`, ({ status }) => {
        expect(status).toBe("Terminated");
        resolve(null);
      });
    });
  },

  revoking: (sandbox: SandboxedExec) => {
    return new Promise((resolve) => {
      sandbox.exec(`while (1);`, ({ status }) => {
        expect(status).toBe("Revoked");
        resolve(null);
      });
    });
  },

  libraryError: (sandbox: SandboxedExec) => {
    return new Promise((resolve) => {
      sandbox.exec(`yield libraryError();`, (result) => {
        expect(result).toEqual({
          status: "Library Error",
          libraryError: "Error: B",
        });

        resolve(null);
      });
    });
  },

  scriptError: (sandbox: SandboxedExec) => {
    return new Promise((resolve) => {
      sandbox.exec(`throw new Error("A");`, (result) => {
        expect(result).toEqual({
          status: "Executed",
          outputs: {},
          error: "Error: A",
        });

        resolve(null);
      });
    });
  },
};

describe("Integration", () => {
  it("Library Calling", async () => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);
    await spec.syncExecution(sandbox, "output");
  });

  it("Output Renaming", async () => {
    const sandbox = new SandboxedExec({ output: "log", library });
    document.head.appendChild(sandbox.iframe);
    await spec.syncExecution(sandbox, "log");
  });

  it("Serial Execution", async () => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);

    await Promise.all([
      spec.asyncExecution(sandbox, "output"),
      spec.asyncExecution(sandbox, "output"),
    ]);
  });

  it("Parallel Execution", async () => {
    const sandbox1 = new SandboxedExec({ library });
    const sandbox2 = new SandboxedExec({ library });
    document.head.appendChild(sandbox1.iframe);
    document.head.appendChild(sandbox2.iframe);

    await Promise.all([
      spec.asyncExecution(sandbox1, "output"),
      spec.asyncExecution(sandbox2, "output"),
    ]);
  });

  it("Library Error", async () => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);
    await spec.libraryError(sandbox);
  });

  it("Script Error", async () => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);
    await spec.scriptError(sandbox);
  });

  it("Timeout Termination & Re-Start", async () => {
    const sandbox = new SandboxedExec({ library, timeout: 100 });
    document.head.appendChild(sandbox.iframe);
    await spec.termination(sandbox);
  });

  it("Manual Termination & Re-Start", async () => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);

    await new Promise((resolve) => {
      const stop = sandbox.exec(`while (1) {}`, ({ status }) => {
        expect(status).toBe("Terminated");
        resolve(null);
      });

      setTimeout(stop, 100);
    });

    await spec.asyncExecution(sandbox, "output");
  });

  it("Revoking & Re-Start", (done) => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);

    const stop = sandbox.exec(`while (1) {}`, ({ status }) => {
      expect(status).toBe("Revoked");

      sandbox.exec(`output("x", 1);`, (result) => {
        expect(result).toEqual({
          status: "Executed",
          outputs: { x: 1 },
          error: null,
        });
        done();
      });
    });

    stop();
  });

  it("Stop All Scripts & Re-Start", async () => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);
    setTimeout(() => sandbox.stopAll(), 100);

    await Promise.all([
      spec.termination(sandbox),
      spec.revoking(sandbox),
      spec.revoking(sandbox),
    ]);

    await spec.asyncExecution(sandbox, "output");
  });

  it("Ignoring Notification From Done Script's Library Call", (done) => {
    const sandbox = new SandboxedExec({ library });
    document.head.appendChild(sandbox.iframe);

    Promise.race([
      spec.asyncExecution(sandbox, "output"),
      timeout("Not Called", 200),
    ]).then((x) => {
      expect(x).toBe("Not Called");
      done();
    });

    sandbox.stopAll();
  });
});
