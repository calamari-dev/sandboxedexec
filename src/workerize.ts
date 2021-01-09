export const workerize = (sandboxId: string, script: string): string => `\
(() => {
  "use strict";
  const blob = new Blob([\`${script}\`], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  let worker = null;

  window.addEventListener("message", ({ data }) => {
    if (data["type"] === "EXEC_TERMINATE") {
      worker && worker.terminate();
      worker = null;
      return;
    }

    if (!worker) {
      worker = new Worker(url);      
      worker.onmessage = ({ data }) => {
        window.parent.postMessage(data, "*");
      };
    }

    worker.postMessage(data);
  });

  window.parent.postMessage({ sandboxId: "${sandboxId}", type: "INIT" }, "*");
})();
`;
