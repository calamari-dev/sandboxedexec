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
      status: "Terminated" | "Revoked";
    }
  | {
      status: "Executed";
      outputs: Record<string, unknown>;
      error: string | null;
    }
  | {
      status: "Library Error";
      libraryError: string | null;
    };
