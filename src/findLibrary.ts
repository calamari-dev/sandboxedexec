import type { Library } from "./types";

export const findLibrary = (
  library: Library,
  path: string[]
): ((...x: any[]) => unknown) | null => {
  let parent: Library = library;

  for (let i = 0; i < path.length; i++) {
    const current = parent[path[i]];

    switch (typeof current) {
      case "function": {
        return current;
      }
      case "undefined": {
        return null;
      }
      case "object": {
        parent = current;
      }
    }
  }

  return null;
};
