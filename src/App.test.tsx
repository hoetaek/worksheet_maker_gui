import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the Korean studio shell with the word search workflow by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /학습 자료 제작 스튜디오/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /도구/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /낱말 찾기/i })).toBeInTheDocument();
    const studentInfo = screen.getByLabelText(/학생 정보/i);
    expect(within(studentInfo).getByText('학년')).toBeInTheDocument();
    expect(within(studentInfo).getByText('3')).toBeInTheDocument();
    expect(within(studentInfo).getByText('반')).toBeInTheDocument();
    expect(within(studentInfo).getByText('1')).toBeInTheDocument();
    expect(within(studentInfo).getByText('이름')).toBeInTheDocument();
  });

  it('switches between the migrated workflows', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /단어 활동지/i }));
    expect(screen.getByRole('heading', { level: 2, name: /단어 활동지/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));
    expect(screen.getByRole('group', { name: /슬라이드 양식/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /도블 카드/i }));
    expect(screen.getByText(/단어 31개가 정확히 필요합니다/i)).toBeInTheDocument();
  });

  it('updates keyword rows as words are edited', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat, dog');

    const keywordTable = screen.getByLabelText(/검색어 목록/i);
    expect(within(keywordTable).getAllByText('cat')).toHaveLength(2);
    expect(within(keywordTable).getAllByText('dog')).toHaveLength(2);
  });

  it('puts the first searched photo in the row and lets teachers change it', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: '토끼 png',
            provider: 'openverse',
            results: [
              {
                id: 'openverse:rabbit-1',
                title: 'Rabbit one',
                image_url: 'https://example.com/rabbit-one.jpg',
                thumbnail_url: 'https://example.com/rabbit-one-thumb.jpg',
                source_url: 'https://openverse.org/image/rabbit-1',
                provider: 'openverse',
              },
              {
                id: 'openverse:rabbit-2',
                title: 'Rabbit two',
                image_url: 'https://example.com/rabbit-two.jpg',
                thumbnail_url: 'https://example.com/rabbit-two-thumb.jpg',
                source_url: 'https://openverse.org/image/rabbit-2',
                provider: 'openverse',
              },
            ],
          }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const keywordTable = screen.getByLabelText(/검색어 목록/i);
    const firstRow = within(keywordTable).getAllByText('토끼')[0].closest('.keyword-row');
    expect(firstRow).not.toBeNull();

    const findButton = within(firstRow as HTMLElement).getByRole('button', { name: '찾기' });
    await user.click(findButton);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/images/search?query=%ED%86%A0%EB%81%BC&limit=5&provider=auto',
    );

    expect(screen.getByLabelText('토끼 사진 URL')).toHaveValue(
      'https://example.com/rabbit-one.jpg',
    );

    await user.click(within(firstRow as HTMLElement).getByRole('button', { name: '변경' }));

    const dialog = await screen.findByRole('dialog', { name: /토끼 사진 선택/i });
    expect(within(dialog).getByText('사진 2장 중 선택')).toBeInTheDocument();
    expect(within(dialog).getByText('추천')).toBeInTheDocument();
    expect(within(dialog).getByText('Rabbit one')).toBeInTheDocument();
    expect(within(dialog).getByText('Rabbit two')).toBeInTheDocument();

    await user.click(within(dialog).getAllByRole('button', { name: '이 사진 사용' })[1]);

    expect(screen.getByLabelText('토끼 사진 URL')).toHaveValue(
      'https://example.com/rabbit-two.jpg',
    );
  });

  it('finds first photos for all words at once and keeps cached alternatives', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      const requestUrl = new URL(url, 'http://localhost');
      const query = requestUrl.searchParams.get('query');
      const slug = query === 'cat' ? 'cat' : 'dog';

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query,
            provider: 'auto',
            results: [
              {
                id: `openverse:${slug}-1`,
                title: `${slug} one`,
                image_url: `https://example.com/${slug}-one.jpg`,
                thumbnail_url: `https://example.com/${slug}-one-thumb.jpg`,
                source_url: `https://openverse.org/image/${slug}-1`,
                provider: 'openverse',
              },
              {
                id: `openverse:${slug}-2`,
                title: `${slug} two`,
                image_url: `https://example.com/${slug}-two.jpg`,
                thumbnail_url: `https://example.com/${slug}-two-thumb.jpg`,
                source_url: `https://openverse.org/image/${slug}-2`,
                provider: 'openverse',
              },
            ],
          }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat, dog');
    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(screen.getByLabelText('cat 사진 URL')).toHaveValue('https://example.com/cat-one.jpg');
    expect(screen.getByLabelText('dog 사진 URL')).toHaveValue('https://example.com/dog-one.jpg');

    const keywordTable = screen.getByLabelText(/검색어 목록/i);
    const catRow = within(keywordTable).getAllByText('cat')[0].closest('.keyword-row');
    await user.click(within(catRow as HTMLElement).getByRole('button', { name: '변경' }));
    const dialog = await screen.findByRole('dialog', { name: /cat 사진 선택/i });

    await user.click(within(dialog).getAllByRole('button', { name: '이 사진 사용' })[1]);

    expect(screen.getByLabelText('cat 사진 URL')).toHaveValue('https://example.com/cat-two.jpg');
  });
});
