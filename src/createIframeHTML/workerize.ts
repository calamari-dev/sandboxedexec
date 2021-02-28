export const workerize = (script: string): string => `\
(() => {
  "use strict";
  const blob = new Blob([\`${script}\`], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  let worker = null;

  const postParent = (json) => {
    window.parent.postMessage(json, "*");
  };

  window.addEventListener("message", ({ data }) => {
    switch(data.type) {
      case "EXEC_CALL": {
        if (!worker) {
          worker = new Worker(url);
          worker.onmessage = ({ data }) => {
            postParent(data);
          };
        }

        worker.postMessage(data);
        return;
      }

      case "EXEC_TERMINATE": {
        worker.terminate();
        worker = null;
        postParent({ type: "TERMINATED" });
        return;
      }

      case "LIB_RESULT": {
        worker.postMessage(data);
        return;
      }
    }
  }, false);

  postParent({ type: "INIT" });
})();
`;
