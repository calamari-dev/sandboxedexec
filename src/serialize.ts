import type { Library } from "./types";

type SerializedLib = {
  [T in string]?: SerializedLib | null;
};

export const serialize = (
  library: Library,
  path: string[] = []
): SerializedLib => {
  const result: SerializedLib = {};

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
