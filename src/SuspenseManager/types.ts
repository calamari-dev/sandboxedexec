import { Result } from "../types";

export interface Suspense {
  script: string;
  callback: (x: Result) => void;
}

export type SuspenseRunner = (
  script: string,
  callback: (x: Result) => void
) => () => void;
