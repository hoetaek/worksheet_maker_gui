import { describe, expect, it } from 'vitest';
import { buildKeywordRows, parseWords } from './words';

describe('word parsing', () => {
  it('extracts Korean and English words while preserving underscore phrases as spaces', () => {
    expect(parseWords('토끼, 거북이, police_officer, Banana!')).toEqual([
      '토끼',
      '거북이',
      'police officer',
      'banana',
    ]);
  });

  it('builds image search keywords with an optional suffix', () => {
    expect(buildKeywordRows(['토끼', 'police officer'], 'png')).toEqual([
      { word: '토끼', keyword: '토끼 png', searchCount: 5 },
      { word: 'police officer', keyword: 'police officer png', searchCount: 5 },
    ]);
  });
});
