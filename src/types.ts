export interface SandboxedExecConfig {
  output?: string;
  library?: Library;
  worker?: boolean;
}

export type Library = {
  [T in string]?: Library | ((...x: any[]) => unknown);
};

export type Result = {
  result: Record<string, unknown>;
  error: string | null;
};

export type SandboxMessage =
  | {
      sandboxId: string;
      type: "INIT";
    }
  | {
      sandboxId: string;
      type: "EXEC_RESULT";
      result: Record<string, unknown>;
      error: string | null;
    }
  | {
      sandboxId: string;
      type: "LIB_CALL";
      contextId: string;
      path: string[];
      arguments: unknown[];
    };
