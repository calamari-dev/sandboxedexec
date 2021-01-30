import type { Library } from "./types";

type SerializedLibrary = {
  [T in string]?: SerializedLibrary | null;
};

export const serialize = (
  library: Library,
  path: string[] = []
): SerializedLibrary => {
  const result: SerializedLibrary = {};

  for (let key of Object.keys(library)) {
    const value = library[key];

    switch (typeof value) {
      case "function": {
        result[key] = null;
        break;
      }
      case "object": {
        result[key] = serialize(value, [...path, key]);
        break;
      }
    }
  }

  return result;
};
