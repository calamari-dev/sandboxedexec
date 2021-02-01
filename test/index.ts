import SandboxedExec from "../src";

const library = {
  ordinalA: {
    add: (x: number, y: number) => {
      return x + y;
    },
    str: {
      concat: (x: string, y: string) => {
        return x + y;
      },
    },
  },
  ordinalB: {
    shift: (x: number[]) => {
      return [...x.slice(1), x[0]];
    },
    isPythagorean: ([x, y, z]: [number, number, number]) => {
      return x ** 2 + y ** 2 === z ** 2;
    },
  },
  libraryError: () => {
    throw new Error("B");
  },
};

const spec = {
  ordinalA: (sandbox: SandboxedExec, output: string) => {
    const script =
      `${output}("sum", yield ordinalA.add(1, 2));` +
      `${output}("con", yield ordinalA.str.concat("a", "b"));`;

    return new Promise((resolve) => {
      sandbox.exec(script, (result) => {
        expect(result.status).toBe("Executed");
        if (result.status !== "Executed") return;
        expect(result.outputs.sum).toBe(3);
        expect(result.outputs.con).toBe("ab");
        resolve(null);
      });
    });
  },
  ordinalB: (sandbox: SandboxedExec, output: string) => {
    const script =
      `${output}("shifted", yield ordinalB.shift([3, 1, 2]));` +
      `${output}("answer", yield ordinalB.isPythagorean([3, 4, 5]));`;

    return new Promise((resolve) => {
      sandbox.exec(script, (result) => {
        expect(result.status).toBe("Executed");
        if (result.status !== "Executed") return;
        expect(result.outputs.shifted).toEqual([1, 2, 3]);
        expect(result.outputs.answer).toBe(true);
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
        expect(result.status).toBe("Library Error");
        if (result.status !== "Library Error") return;
        expect(result.libraryError).toBe("Error: B");
        resolve(null);
      });
    });
  },
  scriptError: (sandbox: SandboxedExec) => {
    return new Promise((resolve) => {
      sandbox.exec(`throw new Error("A");`, (result) => {
        expect(result.status).toBe("Executed");
        if (result.status !== "Executed") return;
        expect(result.error).toBe("Error: A");
        resolve(null);
      });
    });
  },
};

it("Library Calling", async () => {
  const sandbox = new SandboxedExec({ library });
  document.head.appendChild(sandbox.iframe);
  await spec.ordinalA(sandbox, "output");
});

it("Output Renaming", async () => {
  const sandbox = new SandboxedExec({ output: "log", library });
  document.head.appendChild(sandbox.iframe);
  await spec.ordinalA(sandbox, "log");
});

it("Serial Execution", async () => {
  const sandbox = new SandboxedExec({ library });
  document.head.appendChild(sandbox.iframe);

  await Promise.all([
    spec.ordinalA(sandbox, "output"),
    spec.ordinalB(sandbox, "output"),
  ]);
});

it("Parallel Execution", async () => {
  const sandbox1 = new SandboxedExec({ library });
  const sandbox2 = new SandboxedExec({ library });
  document.head.appendChild(sandbox1.iframe);
  document.head.appendChild(sandbox2.iframe);

  await Promise.all([
    spec.ordinalA(sandbox1, "output"),
    spec.ordinalA(sandbox2, "output"),
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

  await spec.ordinalA(sandbox, "output");
});

it("Revoking & Re-Start", (done) => {
  const sandbox = new SandboxedExec({ library });
  document.head.appendChild(sandbox.iframe);

  const stop = sandbox.exec(`while (1) {}`, ({ status }) => {
    expect(status).toBe("Revoked");

    sandbox.exec(`output("x", 1);`, (result) => {
      expect(result.status).toBe("Executed");
      if (result.status !== "Executed") return;
      expect(result.outputs.x).toBe(1);
      done();
    });
  });

  stop();
});

it("Stop All Scripts & Re-Start", async () => {
  const sandbox = new SandboxedExec({ library });
  document.head.appendChild(sandbox.iframe);
  window.setTimeout(() => sandbox.stopAll(), 100);

  await Promise.all([
    spec.termination(sandbox),
    spec.revoking(sandbox),
    spec.revoking(sandbox),
  ]);

  await spec.ordinalA(sandbox, "output");
});
