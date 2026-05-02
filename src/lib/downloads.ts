import type { FlickerTemplate } from './materials';
import type { WordSearchResult } from './wordSearch';

export type WordImagePayload = {
  word: string;
  image?: string;
};

export async function downloadBlob(
  endpoint: string,
  payload: unknown,
  filename: string,
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('파일 생성에 실패했습니다.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toWordImagePayload(
  words: string[],
  imageMap: Record<string, string>,
): WordImagePayload[] {
  return words.map((word) => ({
    word,
    image: imageMap[word] || undefined,
  }));
}

export function downloadFlickerPptx(
  words: string[],
  imageMap: Record<string, string>,
  templates: FlickerTemplate[],
): Promise<void> {
  return downloadBlob(
    '/api/materials/flicker.pptx',
    { items: toWordImagePayload(words, imageMap), templates },
    '단어깜빡이.pptx',
  );
}

export function downloadWorksheetDocx(options: {
  words: string[];
  imageMap: Record<string, string>;
  columns: number;
  syllables: boolean;
  grade: number;
  classNumber: number;
}): Promise<void> {
  return downloadBlob(
    '/api/materials/worksheet.docx',
    {
      items: toWordImagePayload(options.words, options.imageMap),
      columns: options.columns,
      syllables: options.syllables,
      grade: options.grade,
      class_number: options.classNumber,
    },
    '단어활동지.docx',
  );
}

export function downloadWordSearchDocx(options: {
  words: string[];
  imageMap: Record<string, string>;
  puzzle: WordSearchResult | null;
  grade: number;
  classNumber: number;
}): Promise<void> {
  if (!options.puzzle) {
    return Promise.reject(new Error('먼저 퍼즐을 만들 단어를 입력하세요.'));
  }

  return downloadBlob(
    '/api/materials/word-search.docx',
    {
      words: options.words,
      grid: options.puzzle.grid,
      hints: toWordImagePayload(options.words, options.imageMap),
      grade: options.grade,
      class_number: options.classNumber,
      title: '낱말 찾기',
    },
    '낱말찾기.docx',
  );
}

export function downloadDobblePptx(
  cards: WordImagePayload[][],
  picturesPerCard: number,
): Promise<void> {
  return downloadBlob(
    '/api/materials/dobble.pptx',
    { cards, pictures_per_card: picturesPerCard },
    '도블카드.pptx',
  );
}
