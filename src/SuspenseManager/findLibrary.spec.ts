import { findLibrary } from "./findLibrary";

const library = {
  A: () => null,
  B: {
    C: () => null,
    D: { E: () => null },
  },
} as const;

it("Library Finding", () => {
  expect(findLibrary(library, ["A"])).toBe(library.A);
  expect(findLibrary(library, ["B", "C"])).toBe(library.B.C);
  expect(findLibrary(library, ["B", "D", "E"])).toBe(library.B.D.E);
  expect(findLibrary(library, ["F"])).toBe(null);
});
