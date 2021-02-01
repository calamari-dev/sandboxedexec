// Public Typings
export interface SandboxedExecConfig {
  output?: string;
  library?: Library;
  timeout?: number;
}

export type Library = {
  [T in string]?: Library | ((...x: any[]) => unknown);
};

export type Result =
  | {
      status: "Executed";
      outputs: Record<string, unknown>;
      error: string | null;
    }
  | {
      status: "Library Error";
      libraryError: string | null;
    }
  | {
      status: "Terminated" | "Revoked";
    };

// Private Typings
export type SuspenseRunner = (
  script: string,
  callback: (x: Result) => void
) => () => void;

export type SandboxMessage =
  | {
      type: "INIT";
      sandboxId: string;
    }
  | {
      type: "EXEC_RESULT";
      sandboxId: string;
      outputs: Record<string, unknown>;
      error: string | null;
    }
  | {
      type: "TERMINATED";
      sandboxId: string;
    }
  | {
      type: "LIB_CALL";
      sandboxId: string;
      path: string[];
      arguments: unknown[];
    };
