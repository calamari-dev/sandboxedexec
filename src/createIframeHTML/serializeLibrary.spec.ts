import { serializeLibrary } from "./serializeLibrary";

const library = {
  A: () => null,
  B: {
    C: () => null,
    D: { E: () => null },
  },
} as const;

it("Library Serialization", () => {
  expect(serializeLibrary(library)).toEqual({
    A: null,
    B: {
      C: null,
      D: { E: null },
    },
  });
});
