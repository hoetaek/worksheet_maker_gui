import { describe, expect, it } from 'vitest';
import { buildDobbleCards, requiredDobbleWordCount } from './dobble';

describe('dobble card generation', () => {
  it('calculates required words from pictures per card', () => {
    expect(requiredDobbleWordCount(6)).toBe(31);
  });

  it('creates cards where every pair shares exactly one symbol', () => {
    const cards = buildDobbleCards(4);
    expect(cards).toHaveLength(13);
    expect(cards.every((card) => card.length === 4)).toBe(true);

    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const shared = cards[i].filter((symbol) => cards[j].includes(symbol));
        expect(shared).toHaveLength(1);
      }
    }
  });
});
