import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadDobblePptx,
  downloadFlickerPptx,
  downloadWordSearchDocx,
  downloadWorksheetDocx,
} from './downloads';

describe('downloads', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('posts selected images to every generated document endpoint', async () => {
    const fetcher = stubDownloadTransport();
    const imageMap = { cat: 'data:image/png;base64,cat-image' };

    await downloadFlickerPptx(['cat'], imageMap, ['image']);
    expect(lastPost(fetcher)).toEqual({
      endpoint: '/api/materials/flicker.pptx',
      body: {
        items: [{ word: 'cat', image: imageMap.cat }],
        templates: ['image'],
      },
    });

    await downloadWorksheetDocx({
      words: ['cat'],
      imageMap,
      columns: 1,
      syllables: false,
      grade: 3,
      classNumber: 1,
    });
    expect(lastPost(fetcher)).toEqual({
      endpoint: '/api/materials/worksheet.docx',
      body: {
        items: [{ word: 'cat', image: imageMap.cat }],
        columns: 1,
        syllables: false,
        grade: 3,
        class_number: 1,
      },
    });

    await downloadWordSearchDocx({
      words: ['cat'],
      imageMap,
      puzzle: {
        grid: [['c', 'a', 't']],
        answerGrid: [['c', 'a', 't']],
        placements: [{ word: 'cat', cells: [] }],
      },
      grade: 3,
      classNumber: 1,
    });
    expect(lastPost(fetcher)).toEqual({
      endpoint: '/api/materials/word-search.docx',
      body: {
        words: ['cat'],
        grid: [['c', 'a', 't']],
        hints: [{ word: 'cat', image: imageMap.cat }],
        grade: 3,
        class_number: 1,
        title: '낱말 찾기',
      },
    });

    await downloadDobblePptx([[{ word: 'cat', image: imageMap.cat }]], 3);
    expect(lastPost(fetcher)).toEqual({
      endpoint: '/api/materials/dobble.pptx',
      body: {
        cards: [[{ word: 'cat', image: imageMap.cat }]],
        pictures_per_card: 3,
        display_mode: 'image-word',
      },
    });
  });

  it('posts the selected dobble display mode', async () => {
    const fetcher = stubDownloadTransport();

    await downloadDobblePptx([[{ word: 'cat' }]], 3, 'image');

    expect(lastPost(fetcher)).toEqual({
      endpoint: '/api/materials/dobble.pptx',
      body: {
        cards: [[{ word: 'cat' }]],
        pictures_per_card: 3,
        display_mode: 'image',
      },
    });
  });
});

function stubDownloadTransport() {
  const fetcher = vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob(['ok'])),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:download'),
    revokeObjectURL: vi.fn(),
  });
  return fetcher;
}

function lastPost(fetcher: ReturnType<typeof stubDownloadTransport>) {
  const [endpoint, init] = fetcher.mock.calls.at(-1) as [string, RequestInit];
  return {
    endpoint,
    body: JSON.parse(init.body as string) as unknown,
  };
}
