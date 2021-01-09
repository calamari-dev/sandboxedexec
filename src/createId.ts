export const createId = (): string => {
  return Array(32)
    .fill(0)
    .map(() => ((Math.random() * 16) | 0).toString(16))
    .join("");
};
