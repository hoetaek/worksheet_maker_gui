export type WordSearchDifficulty = 1 | 2 | 3 | 4;
export type FillerMode = 'easy' | 'balanced' | 'overlap';

export type WordSearchOptions = {
  words: string[];
  width: number;
  height: number;
  difficulty: WordSearchDifficulty;
  fillerMode: FillerMode;
  uppercase?: boolean;
  seed?: number;
};

export type WordPlacement = {
  word: string;
  cells: Array<{ x: number; y: number }>;
};

export type WordSearchResult = {
  grid: string[][];
  answerGrid: string[][];
  placements: WordPlacement[];
};

type Direction = { dx: number; dy: number };

const DIRECTIONS_BY_DIFFICULTY: Record<WordSearchDifficulty, Direction[]> = {
  1: [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
  ],
  2: [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ],
  3: [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
  ],
  4: [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
  ],
};

const ENGLISH_FILLER = 'abcdefghijklmnopqrstuvwxyz';
const KOREAN_FILLER =
  '가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후기니디리미비시이지치키티피히';

export function createWordSearch(options: WordSearchOptions): WordSearchResult {
  const words = normalizeWords(options.words, options.uppercase);
  const width = Math.max(5, Math.floor(options.width));
  const height = Math.max(5, Math.floor(options.height));
  const longestWord = Math.max(...words.map((word) => word.length), 0);

  if (longestWord > Math.max(width, height)) {
    throw new Error('At least one word is longer than the puzzle dimensions.');
  }

  const random = seededRandom(options.seed ?? Date.now());
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => ''));
  const placements: WordPlacement[] = [];

  for (const word of words.sort((left, right) => right.length - left.length)) {
    const placement = placeWord(grid, word, DIRECTIONS_BY_DIFFICULTY[options.difficulty], random);
    if (!placement) {
      throw new Error(`Could not place "${word}". Try a larger grid or easier direction setting.`);
    }
    placements.push(placement);
  }

  const answerGrid = grid.map((row) => row.map((cell) => cell || ''));
  fillEmptyCells(grid, words, options.fillerMode, random, options.uppercase ?? false);

  return {
    grid,
    answerGrid,
    placements: placements.sort((left, right) => left.word.localeCompare(right.word)),
  };
}

function normalizeWords(words: string[], uppercase = false): string[] {
  const normalized = words.map((word) => word.replace(/\s+/g, '').trim()).filter(Boolean);

  return uppercase ? normalized.map((word) => word.toUpperCase()) : normalized;
}

function placeWord(
  grid: string[][],
  word: string,
  directions: Direction[],
  random: () => number,
): WordPlacement | null {
  const candidates = shuffle(
    directions.flatMap((direction) => allCandidatesForDirection(grid, word, direction)),
    random,
  );

  const bestCandidate = candidates
    .filter((candidate) => canPlace(grid, word, candidate))
    .sort((left, right) => overlapScore(grid, word, right) - overlapScore(grid, word, left))[0];

  if (!bestCandidate) {
    return null;
  }

  const cells = coordinatesFor(word, bestCandidate);
  for (const [index, cell] of cells.entries()) {
    grid[cell.y][cell.x] = word[index];
  }

  return { word, cells };
}

function coordinatesFor(
  word: string,
  direction: Direction & { x: number; y: number },
): WordPlacement['cells'] {
  return Array.from({ length: word.length }, (_, index) => ({
    x: direction.x + direction.dx * index,
    y: direction.y + direction.dy * index,
  }));
}

function canPlace(
  grid: string[][],
  word: string,
  direction: Direction & { x: number; y: number },
): boolean {
  return coordinatesFor(word, direction).every((cell, index) => {
    const existing = grid[cell.y]?.[cell.x];
    return existing !== undefined && (existing === '' || existing === word[index]);
  });
}

function overlapScore(
  grid: string[][],
  word: string,
  direction: Direction & { x: number; y: number },
): number {
  return coordinatesFor(word, direction).reduce((score, cell, index) => {
    return score + (grid[cell.y][cell.x] === word[index] ? 1 : 0);
  }, 0);
}

function allCandidatesForDirection(
  grid: string[][],
  word: string,
  direction: Direction,
): Array<Direction & { x: number; y: number }> {
  const candidates: Array<Direction & { x: number; y: number }> = [];
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const endX = x + direction.dx * (word.length - 1);
      const endY = y + direction.dy * (word.length - 1);
      if (endX >= 0 && endX < width && endY >= 0 && endY < height) {
        candidates.push({ ...direction, x, y });
      }
    }
  }

  return candidates;
}

function fillEmptyCells(
  grid: string[][],
  words: string[],
  fillerMode: FillerMode,
  random: () => number,
  uppercase: boolean,
): void {
  const hasKorean = words.some((word) => /[가-힣]/.test(word));
  const alphabet = hasKorean
    ? KOREAN_FILLER
    : uppercase
      ? ENGLISH_FILLER.toUpperCase()
      : ENGLISH_FILLER;
  const commonLetters = [...words.join('')].slice(0, 7).join('');

  for (const row of grid) {
    for (let index = 0; index < row.length; index += 1) {
      if (row[index]) {
        continue;
      }

      if (fillerMode === 'overlap' && commonLetters) {
        row[index] = pick(`${alphabet}${commonLetters}${commonLetters}`, random);
      } else if (fillerMode === 'easy' && commonLetters) {
        let letter = pick(alphabet, random);
        if (commonLetters.includes(letter)) {
          letter = pick(alphabet, random);
        }
        row[index] = letter;
      } else {
        row[index] = pick(alphabet, random);
      }
    }
  }
}

function pick(source: string, random: () => number): string {
  return source[Math.floor(random() * source.length)] ?? source[0];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
