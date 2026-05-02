export type DobbleCard = number[];

type Field = {
  order: number;
  add: (left: number, right: number) => number;
  multiply: (left: number, right: number) => number;
};

export function requiredDobbleWordCount(picturesPerCard: number): number {
  const order = picturesPerCard - 1;
  return order * order + order + 1;
}

export function validPicturesPerCard(): number[] {
  return [3, 4, 5, 6, 8];
}

export function nearestValidPicturesPerCard(value: number): number {
  return validPicturesPerCard().reduce((best, candidate) => {
    const candidateDistance = Math.abs(candidate - value);
    const bestDistance = Math.abs(best - value);
    return candidateDistance < bestDistance ? candidate : best;
  }, validPicturesPerCard()[0]);
}

export function buildDobbleCards(picturesPerCard: number): DobbleCard[] {
  const order = picturesPerCard - 1;
  const field = createField(order);
  const infinity = (slope: number) => slope;
  const verticalInfinity = order;
  const point = (x: number, y: number) => order + 1 + x * order + y;
  const cards: DobbleCard[] = [];

  cards.push(Array.from({ length: order + 1 }, (_, index) => infinity(index)));

  for (let x = 0; x < order; x += 1) {
    cards.push([
      infinity(verticalInfinity),
      ...Array.from({ length: order }, (_, y) => point(x, y)),
    ]);
  }

  for (let slope = 0; slope < order; slope += 1) {
    for (let intercept = 0; intercept < order; intercept += 1) {
      cards.push([
        infinity(slope),
        ...Array.from({ length: order }, (_, x) =>
          point(x, field.add(field.multiply(slope, x), intercept)),
        ),
      ]);
    }
  }

  return cards;
}

function createField(order: number): Field {
  if (order === 4) {
    return {
      order,
      add: (left, right) => left ^ right,
      multiply: multiplyGf4,
    };
  }

  if (!isPrime(order)) {
    throw new Error(
      'Dobble cards require picturesPerCard - 1 to be prime, or picturesPerCard to be 5.',
    );
  }

  return {
    order,
    add: (left, right) => (left + right) % order,
    multiply: (left, right) => (left * right) % order,
  };
}

function multiplyGf4(left: number, right: number): number {
  let product = 0;

  for (let bit = 0; bit < 2; bit += 1) {
    if ((right >> bit) & 1) {
      product ^= left << bit;
    }
  }

  for (let bit = 3; bit >= 2; bit -= 1) {
    if ((product >> bit) & 1) {
      product ^= 0b111 << (bit - 2);
    }
  }

  return product & 0b11;
}

function isPrime(value: number): boolean {
  if (value < 2) {
    return false;
  }

  for (let factor = 2; factor <= Math.sqrt(value); factor += 1) {
    if (value % factor === 0) {
      return false;
    }
  }

  return true;
}
