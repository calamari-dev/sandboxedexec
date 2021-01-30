interface Config {
  sandboxId: string;
  script: string;
}

export const workerize = ({ sandboxId, script }: Config): string => `\
(() => {
  "use strict";
  const blob = new Blob([\`${script}\`], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  let worker = null;

  const postParent = (json) => {
    window.parent.postMessage(json, "*");
  }

  window.addEventListener("message", ({ data }) => {
    if (data["type"] === "EXEC_CALL") {
      if (!worker) {
        worker = new Worker(url);
        worker.onmessage = ({ data }) => {
          data.sandboxId = "${sandboxId}";
          postParent(data);
        };
      }

      worker.postMessage(data);
      return;
    }

    if (data["type"] === "EXEC_TERMINATE") {
      worker.terminate();
      worker = null;
      postParent({ type: "TERMINATED", sandboxId: "${sandboxId}" });
      return;
    }

    if (data["type"] === "LIB_RESULT") {
      worker.postMessage(data);
    }
  });

  postParent({ type: "INIT", sandboxId: "${sandboxId}" }, "*");
})();
`;
