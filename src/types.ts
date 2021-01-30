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
      result: Record<string, unknown>;
      error: string | null;
    }
  | {
      status: "Library Error";
      libraryError: string | null;
    }
  | {
      status: "Terminated";
    };

export type SandboxMessage =
  | {
      type: "INIT";
      sandboxId: string;
    }
  | {
      type: "EXEC_RESULT";
      sandboxId: string;
      result: Record<string, unknown>;
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
