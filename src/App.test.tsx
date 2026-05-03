import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  afterEach(() => {
    window.localStorage.clear();
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

  it('prioritizes the photo search action below the word list', () => {
    render(<App />);

    const quickActions = screen.getByRole('group', { name: '단어 빠른 작업' });
    expect(
      within(quickActions)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['사진 전체 찾기', '예시 단어 넣기', '단어 복사']);
    expect(within(quickActions).getByRole('button', { name: '사진 전체 찾기' })).toHaveClass(
      'primary-button',
    );
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

  it('blocks incomplete dobble exports and suggests the closest valid card size', async () => {
    const user = userEvent.setup();
    const words = [
      'apple',
      'banana',
      'cherry',
      'date',
      'elderberry',
      'fig',
      'grape',
      'honeydew',
      'kiwi',
      'lemon',
      'mango',
      'nectarine',
      'orange',
    ];
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), words.join(', '));
    await user.click(screen.getByRole('button', { name: /도블 카드/i }));

    expect(screen.getByText(/13개 단어는 카드당 4개 도블에 가장 가깝습니다/i)).toBeInTheDocument();
    expect(screen.queryByText('word 14')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '카드당 4개로 변경' }));

    expect(screen.getByText('13/13 준비됨')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeEnabled();
  });

  it('offers partial dobble as an explicit safe mode for incomplete word counts', async () => {
    const user = userEvent.setup();
    const words = [
      'alpha',
      'bravo',
      'charlie',
      'delta',
      'echo',
      'foxtrot',
      'golf',
      'hotel',
      'india',
      'juliet',
      'kilo',
      'lima',
      'mike',
      'november',
      'oscar',
      'papa',
      'quebec',
      'romeo',
      'sierra',
      'tango',
    ];
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), words.join(', '));
    await user.click(screen.getByRole('button', { name: /도블 카드/i }));

    expect(screen.getByText(/단어 31개가 정확히 필요합니다/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();
    expect(screen.queryByText('word 21')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('부분 도블 만들기'));

    expect(screen.getByText(/안전한 부분 도블/i)).toBeInTheDocument();
    expect(screen.getByText(/모든 카드 쌍은 공통 그림 1개를 유지합니다/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeEnabled();
    expect(screen.queryByText('word 21')).not.toBeInTheDocument();
  });

  it('uses a square puzzle size and stepper-based word search difficulty', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByLabelText('가로 칸')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('세로 칸')).not.toBeInTheDocument();

    const sizeControl = screen.getByRole('group', { name: '퍼즐 크기' });
    expect(within(sizeControl).getByText('15 x 15')).toBeInTheDocument();
    expect(
      within(sizeControl)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['퍼즐 크기 늘리기', '퍼즐 크기 줄이기']);
    await user.click(within(sizeControl).getByRole('button', { name: '퍼즐 크기 줄이기' }));
    expect(within(sizeControl).getByText('14 x 14')).toBeInTheDocument();
    expect(screen.getAllByText('14 x 14').length).toBeGreaterThan(1);

    const difficultyControl = screen.getByRole('group', { name: '난이도' });
    expect(within(difficultyControl).getByText('쉬움')).toBeInTheDocument();
    expect(
      within(difficultyControl)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['난이도 올리기', '난이도 낮추기']);
    expect(within(difficultyControl).getByRole('button', { name: '난이도 낮추기' })).toBeDisabled();

    await user.click(within(difficultyControl).getByRole('button', { name: '난이도 올리기' }));
    expect(within(difficultyControl).getByText('보통')).toBeInTheDocument();
  });

  it('presents word search filler choices as plain Korean option cards', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('combobox', { name: '채움 방식' })).not.toBeInTheDocument();

    const fillerControl = screen.getByRole('group', { name: '채움 방식' });
    expect(
      within(fillerControl)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual([
      '쉽게 찾기낱말 글자를 덜 섞어요',
      '균형 있게기본 추천',
      '더 어렵게비슷한 글자를 섞어요',
    ]);

    await user.click(within(fillerControl).getByRole('button', { name: /더 어렵게/ }));

    expect(within(fillerControl).getByRole('button', { name: /더 어렵게/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('updates the worksheet preview when syllable display is toggled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), '토끼');
    await user.click(screen.getByRole('button', { name: /단어 활동지/i }));

    expect(screen.getAllByText('토끼').length).toBeGreaterThan(0);

    await user.click(screen.getByLabelText('음절 표시'));

    expect(screen.getByText('토 · 끼')).toBeInTheDocument();
  });

  it('restores the edited word list after refresh before photo search', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), '사과, 바나나');

    unmount();
    render(<App />);

    expect(screen.getByLabelText(/단어 목록/i)).toHaveValue('사과, 바나나');
  });

  it('shows word photo rows without exposing search details by default', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat, dog');

    const photoList = screen.getByLabelText(/단어별 사진/i);
    expect(within(photoList).getByText('cat')).toBeInTheDocument();
    expect(within(photoList).getByText('dog')).toBeInTheDocument();
    expect(within(photoList).queryByText('검색어')).not.toBeInTheDocument();
    expect(within(photoList).getByLabelText('cat 사진 자리')).toBeInTheDocument();
    expect(screen.queryByLabelText('검색어 보정어')).not.toBeInTheDocument();
    expect(screen.queryByText('사진 검색 옵션')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('cat 사진 URL')).not.toBeInTheDocument();
    expect(screen.queryByText('검색 개수')).not.toBeInTheDocument();
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

    const photoList = screen.getByLabelText(/단어별 사진/i);
    const firstRow = within(photoList).getByText('토끼').closest('.keyword-row');
    expect(firstRow).not.toBeNull();

    const findButton = within(firstRow as HTMLElement).getByRole('button', { name: '사진 찾기' });
    await user.click(findButton);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/images/search?query=%ED%86%A0%EB%81%BC&limit=8&provider=auto',
    );

    expect(within(firstRow as HTMLElement).getByRole('img', { name: '토끼' })).toHaveAttribute(
      'src',
      'https://example.com/rabbit-one.jpg',
    );

    await user.click(within(firstRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /토끼 사진 선택/i });
    expect(within(dialog).getByText('사진 2장 중 선택')).toBeInTheDocument();
    expect(within(dialog).getByText('사용 중')).toBeInTheDocument();
    expect(within(dialog).getByText('Rabbit one')).toBeInTheDocument();
    expect(within(dialog).getByText('Rabbit two')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '사용 중' })).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: '이 사진 사용' }));

    expect(within(firstRow as HTMLElement).getByRole('img', { name: '토끼' })).toHaveAttribute(
      'src',
      'https://example.com/rabbit-two.jpg',
    );
  });

  it('keeps the image picker open on dialog clicks and closes it on backdrop clicks', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: '토끼',
            provider: 'commons',
            results: [
              {
                id: 'commons:rabbit-1',
                title: 'Rabbit one',
                image_url: 'https://example.com/rabbit-one.jpg',
                thumbnail_url: 'https://example.com/rabbit-one-thumb.jpg',
                source_url: 'https://commons.wikimedia.org/wiki/File:Rabbit.jpg',
                provider: 'commons',
              },
            ],
          }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    const photoList = screen.getByLabelText(/단어별 사진/i);
    const firstRow = within(photoList).getByText('토끼').closest('.keyword-row');
    expect(firstRow).not.toBeNull();

    await user.click(within(firstRow as HTMLElement).getByRole('button', { name: '사진 찾기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await user.click(within(firstRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /토끼 사진 선택/i });
    await user.click(dialog);
    expect(screen.getByRole('dialog', { name: /토끼 사진 선택/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /토끼 사진 선택/i })).not.toBeInTheDocument();

    await user.click(within(firstRow as HTMLElement).getByRole('button', { name: '다른 사진' }));
    const reopenedDialog = await screen.findByRole('dialog', { name: /토끼 사진 선택/i });

    const backdrop = reopenedDialog.parentElement;
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as HTMLElement);

    expect(screen.queryByRole('dialog', { name: /토끼 사진 선택/i })).not.toBeInTheDocument();
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

    const photoList = screen.getByLabelText(/단어별 사진/i);
    const catRow = within(photoList).getByText('cat').closest('.keyword-row');
    const dogRow = within(photoList).getByText('dog').closest('.keyword-row');
    expect(within(catRow as HTMLElement).getByRole('img', { name: 'cat' })).toHaveAttribute(
      'src',
      'https://example.com/cat-one.jpg',
    );
    expect(within(dogRow as HTMLElement).getByRole('img', { name: 'dog' })).toHaveAttribute(
      'src',
      'https://example.com/dog-one.jpg',
    );

    await user.click(within(catRow as HTMLElement).getByRole('button', { name: '다른 사진' }));
    const dialog = await screen.findByRole('dialog', { name: /cat 사진 선택/i });

    await user.click(within(dialog).getByRole('button', { name: '이 사진 사용' }));

    expect(within(catRow as HTMLElement).getByRole('img', { name: 'cat' })).toHaveAttribute(
      'src',
      'https://example.com/cat-two.jpg',
    );
  });

  it('does not overwrite manually selected photos when searching all photos again', async () => {
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

    const photoList = screen.getByLabelText(/단어별 사진/i);
    const catRow = within(photoList).getByText('cat').closest('.keyword-row');
    await user.click(within(catRow as HTMLElement).getByRole('button', { name: '다른 사진' }));
    const dialog = await screen.findByRole('dialog', { name: /cat 사진 선택/i });
    await user.click(within(dialog).getByRole('button', { name: '이 사진 사용' }));

    expect(within(catRow as HTMLElement).getByRole('img', { name: 'cat' })).toHaveAttribute(
      'src',
      'https://example.com/cat-two.jpg',
    );

    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(within(catRow as HTMLElement).getByRole('img', { name: 'cat' })).toHaveAttribute(
      'src',
      'https://example.com/cat-two.jpg',
    );
  });

  it('finds more photos from the image picker without exposing search count settings', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      const requestUrl = new URL(url, 'http://localhost');
      const limit = requestUrl.searchParams.get('limit');

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: 'cat',
            provider: 'auto',
            results:
              limit === '12'
                ? [
                    {
                      id: 'openverse:cat-1',
                      title: 'Cat one',
                      image_url: 'https://example.com/cat-one.jpg',
                      thumbnail_url: 'https://example.com/cat-one-thumb.jpg',
                      source_url: 'https://openverse.org/image/cat-1',
                      provider: 'openverse',
                    },
                    {
                      id: 'openverse:cat-3',
                      title: 'Cat three',
                      image_url: 'https://example.com/cat-three.jpg',
                      thumbnail_url: 'https://example.com/cat-three-thumb.jpg',
                      source_url: 'https://openverse.org/image/cat-3',
                      provider: 'openverse',
                    },
                  ]
                : [
                    {
                      id: 'openverse:cat-1',
                      title: 'Cat one',
                      image_url: 'https://example.com/cat-one.jpg',
                      thumbnail_url: 'https://example.com/cat-one-thumb.jpg',
                      source_url: 'https://openverse.org/image/cat-1',
                      provider: 'openverse',
                    },
                  ],
          }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat');
    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const photoList = screen.getByLabelText(/단어별 사진/i);
    const catRow = within(photoList).getByText('cat').closest('.keyword-row');
    await user.click(within(catRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /cat 사진 선택/i });
    expect(within(dialog).queryByText('Cat three')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '사진 더 찾기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/images/search?query=cat&limit=12&provider=auto',
    );
    expect(within(dialog).getByText('Cat three')).toBeInTheDocument();
  });

  it('lets teachers retry photo search from the picker with a clearer English query', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      const requestUrl = new URL(url, 'http://localhost');
      const query = requestUrl.searchParams.get('query');

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query,
            provider: 'auto',
            results:
              query === 'turtle'
                ? [
                    {
                      id: 'openverse:turtle-1',
                      title: 'Sea turtle',
                      image_url: 'https://example.com/sea-turtle.jpg',
                      thumbnail_url: 'https://example.com/sea-turtle-thumb.jpg',
                      source_url: 'https://openverse.org/image/turtle-1',
                      provider: 'openverse',
                    },
                  ]
                : [
                    {
                      id: 'commons:geo-1',
                      title: 'Turtle statue',
                      image_url: 'https://example.com/turtle-statue.jpg',
                      thumbnail_url: 'https://example.com/turtle-statue-thumb.jpg',
                      source_url: 'https://commons.wikimedia.org/wiki/File:Turtle_statue.jpg',
                      provider: 'commons',
                    },
                  ],
          }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), '거북이');
    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const photoList = screen.getByLabelText(/단어별 사진/i);
    const turtleRow = within(photoList).getByText('거북이').closest('.keyword-row');
    await user.click(within(turtleRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /거북이 사진 선택/i });
    expect(
      within(dialog).getByText(
        /한글 결과가 아쉬우면 영어 이름이나 더 구체적인 표현으로 다시 찾아보세요/,
      ),
    ).toBeInTheDocument();

    const queryInput = within(dialog).getByLabelText('사진 검색어');
    expect(queryInput).toHaveValue('거북이');

    await user.clear(queryInput);
    await user.type(queryInput, 'turtle');
    await user.click(within(dialog).getByRole('button', { name: '다시 찾기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/images/search?query=turtle&limit=8&provider=auto',
    );
    expect(within(dialog).queryByText('Turtle statue')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Sea turtle')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '이 사진 사용' }));

    expect(within(turtleRow as HTMLElement).getByRole('img', { name: '거북이' })).toHaveAttribute(
      'src',
      'https://example.com/sea-turtle.jpg',
    );
  });

  it('opens the photo picker with the backend search term that actually produced results', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: '거북이',
            searched_query: 'turtle',
            provider: 'auto',
            results: [
              {
                id: 'openverse:turtle-1',
                title: 'Sea turtle',
                image_url: 'https://example.com/sea-turtle.jpg',
                thumbnail_url: 'https://example.com/sea-turtle-thumb.jpg',
                source_url: 'https://openverse.org/image/turtle-1',
                provider: 'openverse',
              },
            ],
          }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), '거북이');
    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const photoList = screen.getByLabelText(/단어별 사진/i);
    const turtleRow = within(photoList).getByText('거북이').closest('.keyword-row');
    await user.click(within(turtleRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /거북이 사진 선택/i });

    expect(within(dialog).getByLabelText('사진 검색어')).toHaveValue('turtle');
  });

  it('restores words, selected photos, and cached alternatives after refresh', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: 'cat',
            provider: 'openverse',
            results: [
              {
                id: 'openverse:cat-1',
                title: 'Cat one',
                image_url: 'https://example.com/cat-one.jpg',
                thumbnail_url: 'https://example.com/cat-one-thumb.jpg',
                source_url: 'https://openverse.org/image/cat-1',
                provider: 'openverse',
              },
              {
                id: 'openverse:cat-2',
                title: 'Cat two',
                image_url: 'https://example.com/cat-two.jpg',
                thumbnail_url: 'https://example.com/cat-two-thumb.jpg',
                source_url: 'https://openverse.org/image/cat-2',
                provider: 'openverse',
              },
            ],
          }),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat');
    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));
    await waitFor(() =>
      expect(window.localStorage.getItem('worksheet-maker-workspace-v1')).toContain(
        'https://example.com/cat-one.jpg',
      ),
    );

    unmount();
    render(<App />);

    expect(screen.getByLabelText(/단어 목록/i)).toHaveValue('cat');
    const photoList = screen.getByLabelText(/단어별 사진/i);
    const catRow = within(photoList).getByText('cat').closest('.keyword-row');
    expect(within(catRow as HTMLElement).getByRole('img', { name: 'cat' })).toHaveAttribute(
      'src',
      'https://example.com/cat-one.jpg',
    );

    await user.click(within(catRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /cat 사진 선택/i });
    expect(within(dialog).getByText('Cat two')).toBeInTheDocument();
  });
});
