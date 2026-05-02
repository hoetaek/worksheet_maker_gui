import { describe, expect, it, vi } from 'vitest';
import { buildCommonsImageSearchUrl, searchCommonsImages } from './imageSearch';

describe('image search', () => {
  it('builds a browser-callable Wikimedia Commons image search URL', () => {
    const url = new URL(buildCommonsImageSearchUrl('토끼 png', 4));

    expect(url.origin).toBe('https://commons.wikimedia.org');
    expect(url.searchParams.get('origin')).toBe('*');
    expect(url.searchParams.get('generator')).toBe('search');
    expect(url.searchParams.get('gsrnamespace')).toBe('6');
    expect(url.searchParams.get('gsrsearch')).toBe('토끼 png');
    expect(url.searchParams.get('iiprop')).toContain('extmetadata');
  });

  it('normalizes image candidates from Wikimedia Commons responses', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => ({
        query: {
          pages: {
            '1': {
              pageid: 1,
              title: 'File:Rabbit.jpg',
              imageinfo: [
                {
                  thumburl: 'https://example.com/rabbit-thumb.jpg',
                  url: 'https://example.com/rabbit.jpg',
                  descriptionurl: 'https://commons.wikimedia.org/wiki/File:Rabbit.jpg',
                  mime: 'image/jpeg',
                  extmetadata: {
                    Artist: { value: '<span>Jane</span>' },
                    LicenseShortName: { value: 'CC BY-SA 4.0' },
                    LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
                  },
                },
              ],
            },
          },
        },
      }),
    });

    await expect(searchCommonsImages('rabbit', { fetcher, limit: 1 })).resolves.toEqual([
      {
        id: '1',
        title: 'Rabbit',
        imageUrl: 'https://example.com/rabbit.jpg',
        thumbnailUrl: 'https://example.com/rabbit-thumb.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rabbit.jpg',
        credit: 'Jane',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
    ]);
  });
});
