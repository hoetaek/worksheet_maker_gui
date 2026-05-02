import { describe, expect, it } from 'vitest';
import { createWordSearch } from './wordSearch';

describe('word search generation', () => {
  it('places requested words in the grid and fills empty cells', () => {
    const puzzle = createWordSearch({
      words: ['apple', 'pear', 'melon'],
      width: 12,
      height: 12,
      difficulty: 1,
      fillerMode: 'balanced',
      uppercase: true,
    });

    expect(puzzle.grid).toHaveLength(12);
    expect(puzzle.grid.every((row) => row.length === 12)).toBe(true);
    expect(puzzle.placements.map((placement) => placement.word).sort()).toEqual([
      'APPLE',
      'MELON',
      'PEAR',
    ]);
    expect(puzzle.grid.flat().every((cell) => /^[A-Z가-힣]$/.test(cell))).toBe(true);
  });
});
