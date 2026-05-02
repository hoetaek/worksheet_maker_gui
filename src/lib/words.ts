export type KeywordRow = {
  word: string;
  keyword: string;
  searchCount: number;
};

export type ParsedWord = {
  value: string;
  language: 'korean' | 'english' | 'mixed';
};

const WORD_PATTERN = /[A-Za-z가-힣]+(?:_[A-Za-z가-힣]+)*/g;
const KOREAN_PATTERN = /[가-힣]/;
const ENGLISH_PATTERN = /[A-Za-z]/;

export function parseWords(input: string, options: { dedupe?: boolean } = {}): string[] {
  const { dedupe = true } = options;
  const matches = input.match(WORD_PATTERN) ?? [];
  const words = matches.map((word) => word.replaceAll('_', ' ').trim().toLowerCase());

  if (!dedupe) {
    return words;
  }

  return [...new Set(words)];
}

export function describeWord(word: string): ParsedWord {
  const hasKorean = KOREAN_PATTERN.test(word);
  const hasEnglish = ENGLISH_PATTERN.test(word);

  if (hasKorean && hasEnglish) {
    return { value: word, language: 'mixed' };
  }

  return { value: word, language: hasKorean ? 'korean' : 'english' };
}

export function detectLanguage(words: string[]): ParsedWord['language'] {
  const languages = new Set(words.map((word) => describeWord(word).language));

  if (languages.size === 1) {
    return [...languages][0] ?? 'english';
  }

  return 'mixed';
}

export function buildKeywordRows(words: string[], suffix = '', searchCount = 5): KeywordRow[] {
  const normalizedSuffix = suffix.trim();

  return words.map((word) => ({
    word,
    keyword: [word, normalizedSuffix].filter(Boolean).join(' '),
    searchCount,
  }));
}

export function wordCountStatus(
  count: number,
  requiredCount?: number,
): {
  label: string;
  tone: 'neutral' | 'warning' | 'success';
} {
  if (!requiredCount) {
    return { label: `${count} words`, tone: count > 0 ? 'success' : 'neutral' };
  }

  if (count === requiredCount) {
    return { label: `${count}/${requiredCount} ready`, tone: 'success' };
  }

  if (count < requiredCount) {
    return { label: `${requiredCount - count} more needed`, tone: 'warning' };
  }

  return { label: `${count - requiredCount} extra`, tone: 'warning' };
}
