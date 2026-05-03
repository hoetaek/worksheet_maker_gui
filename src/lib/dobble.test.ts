import { describe, expect, it } from 'vitest';
import {
  buildDobbleCards,
  buildPartialDobbleCards,
  dobbleWordCountOptions,
  requiredDobbleWordCount,
  selectDobblePlan,
  suggestPicturesPerCardForWordCount,
} from './dobble';

describe('dobble card generation', () => {
  it('calculates required words from pictures per card', () => {
    expect(requiredDobbleWordCount(6)).toBe(31);
  });

  it('lists valid picture counts with their required word counts', () => {
    expect(dobbleWordCountOptions()).toEqual([
      { picturesPerCard: 3, requiredWords: 7 },
      { picturesPerCard: 4, requiredWords: 13 },
      { picturesPerCard: 5, requiredWords: 21 },
      { picturesPerCard: 6, requiredWords: 31 },
      { picturesPerCard: 8, requiredWords: 57 },
    ]);
  });

  it('suggests the closest picture count for a word count', () => {
    expect(suggestPicturesPerCardForWordCount(13)).toBe(4);
    expect(suggestPicturesPerCardForWordCount(12)).toBe(4);
    expect(suggestPicturesPerCardForWordCount(0)).toBe(3);
  });

  it('creates cards where every pair shares exactly one symbol', () => {
    const cards = buildDobbleCards(4);
    expect(cards).toHaveLength(13);
    expect(cards.every((card) => card.length === 4)).toBe(true);

    expectEveryPairToShareOneSymbol(cards);
  });

  it('creates a safe partial subset when the word count does not match a full set', () => {
    const cards = buildPartialDobbleCards(6, 20);
    const usedSymbols = new Set(cards.flat());

    expect(cards.length).toBeGreaterThan(1);
    expect(cards.every((card) => card.length === 6)).toBe(true);
    expect(usedSymbols.size).toBeLessThanOrEqual(20);
    expect(Math.max(...usedSymbols)).toBeLessThan(20);
    expectEveryPairToShareOneSymbol(cards);
  });

  it('does not create a one-card partial game', () => {
    expect(buildPartialDobbleCards(6, 6)).toEqual([]);
  });

  it('selects a complete plan when the word count exactly fits a dobble order', () => {
    const plan = selectDobblePlan(13);

    expect(plan.kind).toBe('complete');
    if (plan.kind !== 'complete') {
      throw new Error('expected complete plan');
    }
    expect(plan.picturesPerCard).toBe(4);
    expect(plan.cards).toHaveLength(13);
    expect(plan.usedWordCount).toBe(13);
  });

  it('selects the safest current-word partial plan that uses the most words', () => {
    const plan = selectDobblePlan(20);

    expect(plan.kind).toBe('partial');
    if (plan.kind !== 'partial') {
      throw new Error('expected partial plan');
    }
    expect(plan.picturesPerCard).toBe(5);
    expect(plan.cards).toHaveLength(16);
    expect(plan.usedWordCount).toBe(20);
    expectEveryPairToShareOneSymbol(plan.cards);
  });

  it('explains the minimum safe word count when no dobble plan can be made', () => {
    const plan = selectDobblePlan(3);

    expect(plan).toEqual({
      kind: 'unavailable',
      minimumSafeWords: 5,
      wordsNeeded: 2,
      suggestedPicturesPerCard: 3,
      suggestedRequiredWords: 7,
    });
  });
});

function expectEveryPairToShareOneSymbol(cards: number[][]): void {
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const shared = cards[i].filter((symbol) => cards[j].includes(symbol));
      expect(shared).toHaveLength(1);
    }
  }
}
