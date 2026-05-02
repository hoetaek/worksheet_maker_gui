export type WorksheetLayout = {
  columns: number;
  rows: string[][];
};

export type FlickerTemplate = 'word' | 'image' | 'word-image' | 'blank';

export type FlickerSlide = {
  template: FlickerTemplate;
  word: string;
};

export function buildWorksheetCells(words: string[], columns: number): WorksheetLayout {
  const safeColumns = Math.max(1, Math.floor(columns));
  const rows: string[][] = [];

  for (let index = 0; index < words.length; index += safeColumns) {
    rows.push(words.slice(index, index + safeColumns));
  }

  return { columns: safeColumns, rows };
}

export function buildFlickerSequence(
  templates: FlickerTemplate[],
  words: string[],
): FlickerSlide[] {
  return words.flatMap((word) => templates.map((template) => ({ template, word })));
}

export function splitSyllables(word: string): string {
  return word
    .split('')
    .map((letter) => (/[가-힣]/.test(letter) ? letter : letter))
    .join(' · ');
}
