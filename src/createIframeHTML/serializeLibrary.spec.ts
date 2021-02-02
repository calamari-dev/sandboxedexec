import { serializeLibrary } from "./serializeLibrary";

const library = {
  A: () => 0,
  B: {
    C: () => 0,
    D: { E: () => 0 },
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
