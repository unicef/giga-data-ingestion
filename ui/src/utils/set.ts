export function union<T>(A: Set<T>, B: Set<T>): Set<T> {
  const union = new Set(A);
  B.forEach(el => union.add(el));
  return union;
}

export function intersection<T>(A: Set<T>, B: Set<T>): Set<T> {
  const intersection = new Set<T>();
  B.forEach(el => {
    if (A.has(el)) {
      intersection.add(el);
    }
  });
  return intersection;
}

export function difference<T>(A: Set<T>, B: Set<T>): Set<T> {
  const difference = new Set(A);
  B.forEach(el => difference.delete(el));
  return difference;
}

export function symmetricDifference<T>(A: Set<T>, B: Set<T>): Set<T> {
  const difference = new Set(A);
  B.forEach(el => {
    if (difference.has(el)) {
      difference.delete(el);
    } else {
      difference.add(el);
    }
  });
  return difference;
}
