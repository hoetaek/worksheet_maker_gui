import { describe, expect, it, vi } from 'vitest';
import {
  buildCommonsImageSearchUrl,
  searchBackendImageResults,
  searchBackendImages,
  searchCommonsImages,
} from './imageSearch';

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
        provider: 'commons',
      },
    ]);
  });

  it('passes the selected backend provider and normalizes provider metadata', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => ({
        query: 'rabbit png',
        provider: 'openverse',
        results: [
          {
            id: 'openverse:1',
            title: 'Rabbit',
            image_url: 'https://example.com/rabbit.jpg',
            thumbnail_url: 'https://example.com/rabbit-thumb.jpg',
            source_url: 'https://openverse.org/image/1',
            credit: 'Jane',
            license: 'CC BY 4.0',
            license_url: 'https://creativecommons.org/licenses/by/4.0/',
            provider: 'openverse',
          },
        ],
      }),
    });

    await expect(
      searchBackendImages('rabbit png', { fetcher, limit: 4, provider: 'openverse' }),
    ).resolves.toEqual([
      {
        id: 'openverse:1',
        title: 'Rabbit',
        imageUrl: 'https://example.com/rabbit.jpg',
        thumbnailUrl: 'https://example.com/rabbit-thumb.jpg',
        sourceUrl: 'https://openverse.org/image/1',
        credit: 'Jane',
        license: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        provider: 'openverse',
      },
    ]);

    expect(fetcher).toHaveBeenCalledWith(
      '/api/images/search?query=rabbit+png&limit=4&provider=openverse',
    );
  });

  it('defaults backend searches to automatic provider selection', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => ({
        query: '토끼',
        provider: 'auto',
        results: [],
      }),
    });

    await expect(searchBackendImages('토끼', { fetcher, limit: 5 })).resolves.toEqual([]);

    expect(fetcher).toHaveBeenCalledWith(
      '/api/images/search?query=%ED%86%A0%EB%81%BC&limit=5&provider=auto',
    );
  });

  it('returns the backend search term that actually produced image results', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => ({
        query: '거북이',
        searched_query: 'turtle',
        provider: 'auto',
        results: [],
      }),
    });

    await expect(searchBackendImageResults('거북이', { fetcher, limit: 5 })).resolves.toEqual({
      requestedQuery: '거북이',
      searchedQuery: 'turtle',
      candidates: [],
    });
  });
});
