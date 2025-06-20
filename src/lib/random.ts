export function pickRandomIndex(length: number, excludeIndex?: number): number | null {
  if (length === 0) return null;
  // if there is no excludeIndex, pick a random  index
  if (excludeIndex === undefined || excludeIndex < 0 || excludeIndex >= length) {
    const randomIndex = Math.floor(Math.random() * length);
    return randomIndex;
  }
  // if length is 1 and excludeIndex is 0, return null
  if (length === 1 && excludeIndex === 0) return null;
  // if excludeIndex is valid, pick a random index that is not the excluded one
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * length);
  } while (randomIndex === excludeIndex);
  return randomIndex;
}

export function pickTwoRandomIndices(length: number) {
  if (length < 2) return null; // Need at least two items to pick two indices
  const firstIndex = pickRandomIndex(length);
  if (firstIndex === null) return null; // If no valid index was found
  let secondIndex;
  do {
    secondIndex = pickRandomIndex(length, firstIndex);
  } while (secondIndex === null || secondIndex === firstIndex);
  return [firstIndex, secondIndex];
}
