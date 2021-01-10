import SandboxedExec from "sandboxedexec";

const sandbox = new SandboxedExec({
  worker: true,
  library: {
    arith: {
      add: (x, y) => x + y,
      mul: (x, y) => x * y,
    },
    mock: () => null,
    error: () => {
      throw new Error("Hey!");
    },
  },
});

document.body.appendChild(sandbox.iframe);

Promise.resolve({})
  .then(() => {
    return new Promise((resolve) => {
      sandbox.onExecuted = ({ result, error }) => {
        console.log("Case 1: Ordinaly Call & Error");
        console.log(result.sum === 3 && result.prod === 6 && error === "fire");
        resolve();
      };

      sandbox.execute(
        [
          `output("sum", yield arith.add(1, 2));`,
          `output("prod", yield arith.mul(2, 3));`,
          `throw new Error("fire");`,
        ].join("")
      );
    });
  })
  .then(() => {
    return new Promise((resolve) => {
      sandbox.onLibError = (error) => {
        console.log("Case 2: Lib Error");
        console.log(error.message === "Hey!");
        resolve();
      };

      sandbox.execute(`output("error", yield error());`);
    });
  })
  .then(() => {
    return new Promise((resolve) => {
      sandbox.onExecuted = ({ result }) => {
        console.log("Case 3: Lib call without yield");
        console.log(result.props.path[0] === "mock");
        resolve(result.props);
      };

      sandbox.execute(`output("props", mock());`);
    });
  })
  .then((x) => {
    return new Promise(() => {
      sandbox.onLibError = (result) => {
        console.log("Case 4: Unthinkable Lib Call");
        console.log(result.message === "Library wrongCall is not registered.");
      };

      const wrongCall = { ...x, path: ["wrongCall"] };
      sandbox.execute(`yield ${JSON.stringify(wrongCall)};`);
    });
  });
