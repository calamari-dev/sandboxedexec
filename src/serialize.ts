import { Library } from "./types";

type SerializedLib = {
  [T in string]?: SerializedLib | null;
};

export const serialize = (
  library: Library,
  path: string[] = []
): SerializedLib => {
  const result: SerializedLib = {};

  Object.entries(library).forEach(([key, value]) => {
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
  });

  return result;
};
