import { describe, expect, it } from 'vitest';
import { buildFlickerSequence, buildWorksheetCells } from './materials';

describe('material layout helpers', () => {
  it('lays worksheet words into printable rows', () => {
    expect(buildWorksheetCells(['alpha', 'beta', 'gamma'], 2).rows).toEqual([
      ['alpha', 'beta'],
      ['gamma'],
    ]);
  });

  it('groups flicker slides by template before moving to the next form', () => {
    expect(buildFlickerSequence(['word', 'image', 'word-image'], ['cat', 'dog'])).toEqual([
      { template: 'word', word: 'cat' },
      { template: 'word', word: 'dog' },
      { template: 'image', word: 'cat' },
      { template: 'image', word: 'dog' },
      { template: 'word-image', word: 'cat' },
      { template: 'word-image', word: 'dog' },
    ]);
  });
});
