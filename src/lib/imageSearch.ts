export type ImageCandidate = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  provider: ImageProvider;
  credit?: string | null;
  license?: string | null;
  licenseUrl?: string | null;
};

export type ImageProvider = 'auto' | 'openverse' | 'commons';

type BackendImageCandidate = {
  id: string;
  title: string;
  image_url: string;
  thumbnail_url: string;
  source_url: string;
  provider: ImageProvider;
  credit?: string | null;
  license?: string | null;
  license_url?: string | null;
};

type BackendImageSearchResponse = {
  query: string;
  searched_query?: string;
  provider: ImageProvider;
  results: BackendImageCandidate[];
};

export type ImageSearchResult = {
  requestedQuery: string;
  searchedQuery: string;
  candidates: ImageCandidate[];
};

export type ImageSearchOptions = {
  limit?: number;
  provider?: ImageProvider;
  fetcher?: typeof fetch;
};

export function buildCommonsImageSearchUrl(query: string, limit = 6): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(Math.max(1, Math.min(limit, 12))),
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: '360',
  });

  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}

export async function searchCommonsImages(
  query: string,
  { fetcher = fetch, limit = 6 }: ImageSearchOptions = {},
): Promise<ImageCandidate[]> {
  const response = await fetcher(buildCommonsImageSearchUrl(query, limit));
  if (!response.ok) {
    throw new Error('사진 검색에 실패했습니다.');
  }

  const payload = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          pageid?: number;
          title?: string;
          index?: number;
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            descriptionurl?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  };

  return Object.values(payload.query?.pages ?? {})
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .flatMap((page) => {
      const imageInfo = page.imageinfo?.[0];
      if (!imageInfo?.url || !imageInfo.descriptionurl) {
        return [];
      }

      return [
        {
          id: String(page.pageid),
          title: cleanTitle(page.title ?? ''),
          imageUrl: imageInfo.url,
          thumbnailUrl: imageInfo.thumburl ?? imageInfo.url,
          sourceUrl: imageInfo.descriptionurl,
          provider: 'commons',
          credit: cleanHtml(imageInfo.extmetadata?.Artist?.value),
          license: cleanHtml(imageInfo.extmetadata?.LicenseShortName?.value),
          licenseUrl: imageInfo.extmetadata?.LicenseUrl?.value,
        },
      ];
    });
}

export async function searchBackendImages(
  query: string,
  { fetcher = fetch, limit = 6, provider = 'auto' }: ImageSearchOptions = {},
): Promise<ImageCandidate[]> {
  const result = await searchBackendImageResults(query, { fetcher, limit, provider });
  return result.candidates;
}

export async function searchBackendImageResults(
  query: string,
  { fetcher = fetch, limit = 6, provider = 'auto' }: ImageSearchOptions = {},
): Promise<ImageSearchResult> {
  const params = new URLSearchParams({ query, limit: String(limit), provider });
  const response = await fetcher(`/api/images/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('사진 검색에 실패했습니다.');
  }

  const payload = (await response.json()) as BackendImageSearchResponse;
  return {
    requestedQuery: payload.query,
    searchedQuery: payload.searched_query ?? payload.query,
    candidates: payload.results.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      imageUrl: candidate.image_url,
      thumbnailUrl: candidate.thumbnail_url,
      sourceUrl: candidate.source_url,
      provider: candidate.provider,
      credit: candidate.credit,
      license: candidate.license,
      licenseUrl: candidate.license_url,
    })),
  };
}

function cleanTitle(title: string): string {
  return title
    .replace(/^File:/, '')
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replaceAll('_', ' ')
    .trim();
}

function cleanHtml(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const element = document.createElement('div');
  element.innerHTML = value;
  return element.textContent?.replace(/\s+/g, ' ').trim() || null;
}
