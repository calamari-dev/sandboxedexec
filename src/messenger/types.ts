export type SandboxMessage =
  | {
      type: "INIT" | "TERMINATED";
    }
  | {
      type: "EXEC_RESULT";
      outputs: Record<string, unknown>;
      error: string | null;
    }
  | {
      type: "LIB_CALL";
      path: string[];
      arguments: unknown[];
    };

export abstract class Messenger {
  abstract subscribe(subscriber: (x: SandboxMessage) => void): () => void;
  abstract requestExecution(script: string): void;
  abstract requestTermination(): void;
  abstract sendLibraryResult(result: unknown): void;
}
