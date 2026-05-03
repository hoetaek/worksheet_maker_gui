import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/word-search');
  });

  afterEach(() => {
    delete document.body.dataset.printTarget;
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

  it('shows a separate word preparation home page at the root route', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/');
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: '학습 단어 준비' })).toBeInTheDocument();
    const home = screen.getByRole('region', { name: '단어 준비 홈' });
    expect(home).toHaveClass('word-prep-home');
    expect(within(home).getByRole('region', { name: '단어 입력' })).toBeInTheDocument();
    expect(within(home).getByRole('region', { name: '단어별 사진과 힌트' })).toBeInTheDocument();
    expect(within(home).queryByRole('region', { name: '사진 준비' })).not.toBeInTheDocument();
    expect(within(home).queryByRole('region', { name: '퀴즈 준비' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '학습 자료 선택 안내' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '낱말 찾기' })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'apple, banana');
    await user.type(screen.getByLabelText('apple 퀴즈 힌트'), 'red fruit');
    await user.click(screen.getByRole('button', { name: '현재 단어 담기' }));

    const cart = screen.getByRole('region', { name: '담은 단어' });
    expect(within(cart).getByRole('button', { name: 'apple 추가' })).toBeInTheDocument();
    expect(within(cart).getByRole('button', { name: 'banana 추가' })).toBeInTheDocument();
  });

  it('moves class information into a class information dialog', async () => {
    const user = userEvent.setup();
    render(<App />);

    const inputPanel = screen.getByRole('region', { name: '입력 설정' });
    expect(within(inputPanel).queryByLabelText('학년')).not.toBeInTheDocument();
    expect(within(inputPanel).queryByLabelText('반')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /학급 정보 수정/i }));
    const dialog = screen.getByRole('dialog', { name: '학급 정보' });
    expect(within(dialog).queryByText('출력 설정')).not.toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('학년'));
    await user.type(within(dialog).getByLabelText('학년'), '4');
    await user.clear(within(dialog).getByLabelText('반'));
    await user.type(within(dialog).getByLabelText('반'), '2');
    await user.click(within(dialog).getByRole('button', { name: '완료' }));

    const studentInfo = screen.getByLabelText(/학생 정보/i);
    expect(within(studentInfo).getByText('4')).toBeInTheDocument();
    expect(within(studentInfo).getByText('2')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '학급 정보' })).not.toBeInTheDocument();
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
    const planPanel = screen.getByRole('region', { name: '도블 생성 방식' });
    expect(
      within(planPanel).getByRole('heading', { level: 2, name: /도블 카드/i }),
    ).toBeInTheDocument();
    expect(within(planPanel).queryByText('한글')).not.toBeInTheDocument();
    expect(within(planPanel).queryByText('한글 · 게임 카드 · 단어 6개')).not.toBeInTheDocument();
  });

  it('returns to the word preparation home when the top-left brand is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /도블 카드/i }));
    expect(screen.getByRole('heading', { level: 2, name: /도블 카드/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '홈으로 이동' }));

    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 2, name: '학습 단어 준비' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /낱말 찾기/i })).not.toHaveAttribute('aria-current');
  });

  it('separates material navigation into routes and opens the word drawer for edits', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/');
    render(<App />);

    await user.click(screen.getByRole('button', { name: /도블 카드/i }));

    expect(window.location.pathname).toBe('/dobble');
    expect(screen.getByRole('region', { name: '도블 카드' })).toBeInTheDocument();
    const drawer = screen.getByRole('complementary', { name: '단어 편집 드로어' });
    expect(drawer).toHaveAttribute('data-open', 'false');

    await user.click(screen.getByRole('button', { name: '단어 수정' }));

    expect(drawer).toHaveAttribute('data-open', 'true');
    expect(within(drawer).getByLabelText(/단어 목록/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '단어 드로어 밖 닫기' }));
    expect(drawer).toHaveAttribute('data-open', 'false');
  });

  it('syncs dobble output with drawer word edits and keeps each word photo with its hint', async () => {
    const user = userEvent.setup();
    const words = ['토끼', '거북이', '사자', '강아지', '고양이', '코끼리'];
    window.history.replaceState(null, '', '/dobble');
    window.localStorage.setItem(
      'worksheet-maker-workspace-v1',
      JSON.stringify({
        wordInput: words.join(', '),
        imageMap: Object.fromEntries(
          words.map((word, index) => [word, `data:image/png;base64,${index}`]),
        ),
        quizMap: { 토끼: '빠르게 뛰는 동물' },
      }),
    );
    render(<App />);

    const rail = screen.getByRole('complementary', { name: '자료 설정' });
    expect(within(rail).getByText('카드 4장 · 카드당 단어 3개')).toBeInTheDocument();

    await user.click(within(rail).getByRole('button', { name: '단어 수정' }));

    const drawer = screen.getByRole('complementary', { name: '단어 편집 드로어' });
    const mediaSection = within(drawer).getByRole('region', { name: '사진과 힌트' });
    expect(within(mediaSection).getByLabelText('토끼 퀴즈 힌트')).toHaveValue('빠르게 뛰는 동물');
    expect(within(mediaSection).getAllByText('사진 선택됨')).toHaveLength(6);

    const wordList = within(drawer).getByLabelText(/단어 목록/i);
    await user.clear(wordList);
    await user.type(wordList, '토끼, 거북이, 사자, 강아지, 고양이, 코끼리, 호랑이');

    expect(within(rail).getByText('카드 7장 · 카드당 단어 3개')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '도블 카드 7' })).toBeInTheDocument();

    await user.clear(wordList);
    await user.type(wordList, '토끼, 거북이, 사자');

    expect(within(rail).getByText('단어 2개 더 필요')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '도블 카드 1' })).not.toBeInTheDocument();
  });

  it('loads a material route directly from the URL', () => {
    window.history.replaceState(null, '', '/worksheet');
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: /단어 활동지/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /단어 활동지/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('places dobble material settings in the left rail', () => {
    const words = ['토끼', '거북이', '사자', '강아지', '고양이', '코끼리'];
    window.history.replaceState(null, '', '/dobble');
    window.localStorage.setItem(
      'worksheet-maker-workspace-v1',
      JSON.stringify({
        wordInput: words.join(', '),
        imageMap: Object.fromEntries(
          words.map((word, index) => [word, `data:image/png;base64,${index}`]),
        ),
      }),
    );
    render(<App />);

    const rail = screen.getByRole('complementary', { name: '자료 설정' });
    expect(within(rail).queryByText('단어 6개 · 사진 6/6개 준비')).not.toBeInTheDocument();
    expect(within(rail).getByRole('button', { name: /학급 정보 수정/i })).toBeInTheDocument();
    expect(within(rail).getByText('학급 정보')).toBeInTheDocument();
    expect(within(rail).queryByText('출력 설정')).not.toBeInTheDocument();
    expect(within(rail).queryByText(/^설정$/)).not.toBeInTheDocument();
    expect(within(rail).getByRole('button', { name: '단어 수정' })).toBeInTheDocument();
    expect(within(rail).queryByText('한글')).not.toBeInTheDocument();
    expect(within(rail).queryByText('한글 · 게임 카드 · 단어 6개')).not.toBeInTheDocument();
    expect(within(rail).getByRole('heading', { level: 2, name: '도블 카드' })).toBeInTheDocument();
    expect(within(rail).getByText('바로 출력 가능')).toBeInTheDocument();
    expect(within(rail).getByText('카드 4장 · 카드당 단어 3개')).toBeInTheDocument();
    const printButton = within(rail).getByRole('button', { name: '미리보기 인쇄' });
    const settingsButton = within(rail).getByRole('button', { name: /학급 정보 수정/i });
    const wordEditButton = within(rail).getByRole('button', { name: '단어 수정' });
    expect(wordEditButton.querySelector('.lucide-pencil')).toBeInTheDocument();
    expect(printButton).toBeInTheDocument();
    expect(printButton).toHaveAttribute('title', '미리보기 인쇄');
    expect(printButton.textContent?.trim()).toBe('');
    const exportButton = within(rail).getByRole('button', { name: 'PPTX 다운로드' });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toHaveAttribute('title', 'PPTX 다운로드');
    expect(exportButton.textContent?.trim()).toBe('');
    expect(exportButton).toHaveClass('secondary-button');
    expect(printButton).toHaveClass('primary-button');
    expect(
      exportButton.compareDocumentPosition(printButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(rail).getByText('단어 1개 더 넣으면 카드 7장 가능')).toBeInTheDocument();
    const displayMode = within(rail).getByRole('group', { name: '도블 표시 방식' });
    const outputActions = within(rail).getByRole('group', { name: '출력 작업' });
    expect(within(displayMode).getByText('카드에 넣을 내용')).toBeInTheDocument();
    expect(within(outputActions).getByText('출력')).toBeInTheDocument();
    expect(within(displayMode).queryByText(/^표시$/)).not.toBeInTheDocument();
    expect(
      settingsButton.compareDocumentPosition(wordEditButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      wordEditButton.compareDocumentPosition(displayMode) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      displayMode.compareDocumentPosition(outputActions) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('uses sample words that match the active workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /단어 활동지/i }));
    await user.click(screen.getByRole('button', { name: '예시 단어 넣기' }));
    expect(screen.getByLabelText(/단어 목록/i)).toHaveValue(
      '토끼, 거북이, 사자, 강아지, 고양이, 코끼리',
    );

    await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));
    await user.click(screen.getByRole('button', { name: '예시 단어 넣기' }));
    expect(screen.getByLabelText(/단어 목록/i)).toHaveValue(
      'apple, banana, cat, dog, milk, pencil',
    );

    await user.click(screen.getByRole('button', { name: /도블 카드/i }));
    await user.click(screen.getByRole('button', { name: '예시 단어 넣기' }));
    expect(screen.getByLabelText(/단어 목록/i)).toHaveValue(
      'apple, banana, cherry, date, elderberry, fig, grape, honeydew, kiwi, lemon, mango, nectarine, orange',
    );
  });

  it('summarizes non-dobble exports in the sticky action bar', async () => {
    const user = userEvent.setup();
    render(<App />);

    let actionBar = screen.getByRole('group', { name: '출력 작업' });
    expect(
      within(actionBar).getByText('DOCX · 퍼즐 15 x 15 · 단어 6개 · 사진 0/6개 준비'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /단어 활동지/i }));
    actionBar = screen.getByRole('group', { name: '출력 작업' });
    expect(
      within(actionBar).getByText('DOCX · 단어 6개 · 한 줄 5칸 · 사진 0/6개 준비'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));
    actionBar = screen.getByRole('group', { name: '출력 작업' });
    expect(
      within(actionBar).getByText('PPTX · 슬라이드 18장 · 단어 · 사진 · 단어+사진'),
    ).toBeInTheDocument();
  });

  it('shows a visible reason when flicker export has no selected template', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));
    const templatePicker = screen.getByRole('group', { name: '슬라이드 양식' });

    await user.click(within(templatePicker).getByRole('button', { name: '단어' }));
    await user.click(within(templatePicker).getByRole('button', { name: '사진' }));
    await user.click(within(templatePicker).getByRole('button', { name: '단어+사진' }));

    const actionBar = screen.getByRole('group', { name: '출력 작업' });
    expect(
      within(actionBar).getByText('슬라이드 양식을 하나 이상 선택하세요.'),
    ).toBeInTheDocument();
    expect(within(actionBar).getByRole('button', { name: '미리보기 인쇄' })).toBeDisabled();
    expect(within(actionBar).getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();
  });

  it('prepares a complete dobble set automatically when the current word count fits', async () => {
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
    const planPanel = screen.getByRole('region', { name: '도블 생성 방식' });

    expect(screen.queryByText('카드당 그림 수')).not.toBeInTheDocument();
    expect(within(planPanel).getByText('바로 출력 가능')).toBeInTheDocument();
    expect(within(planPanel).queryByText('영어')).not.toBeInTheDocument();
    expect(within(planPanel).queryByText('영어 · 게임 카드 · 단어 13개')).not.toBeInTheDocument();
    expect(within(planPanel).getByText('카드 13장 · 카드당 단어 4개')).toBeInTheDocument();
    expect(within(planPanel).queryByText('현재 단어 13개')).not.toBeInTheDocument();
    expect(
      within(planPanel).queryByText(/모든 카드 조합을 만들 수 있습니다/i),
    ).not.toBeInTheDocument();
    const rail = screen.getByRole('complementary', { name: '자료 설정' });
    expect(within(rail).getByRole('button', { name: '미리보기 인쇄' })).toBeEnabled();
    expect(within(rail).getByRole('button', { name: 'PPTX 다운로드' })).toBeEnabled();
    expect(
      screen.getByRole('heading', { level: 3, name: '실제 카드 미리보기' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('도블 카드 1')).toHaveClass('dobble-card-preview');
    expect(screen.queryByText('word 14')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeEnabled();
  });

  it('recommends a safe current-word dobble set for incomplete word counts', async () => {
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
    const planPanel = screen.getByRole('region', { name: '도블 생성 방식' });

    expect(screen.queryByText('카드당 그림 수')).not.toBeInTheDocument();
    expect(within(planPanel).queryByText('현재 단어 20개')).not.toBeInTheDocument();
    expect(screen.queryByText('word 21')).not.toBeInTheDocument();
    expect(within(planPanel).getByText('바로 출력 가능')).toBeInTheDocument();
    expect(within(planPanel).queryByText(/축소 세트/i)).not.toBeInTheDocument();
    expect(within(planPanel).getByText('단어 1개 더 넣으면 카드 21장 가능')).toBeInTheDocument();
    expect(within(planPanel).getByText('카드 16장 · 카드당 단어 5개')).toBeInTheDocument();
    expect(within(planPanel).queryByText('자세히 보기')).not.toBeInTheDocument();
    expect(within(planPanel).queryByText(/20\/20개 사용/i)).not.toBeInTheDocument();
    expect(within(planPanel).queryByText(/카드끼리 공통 그림 1개/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: '실제 카드 미리보기' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('도블 카드 1')).toHaveClass('dobble-card-preview');
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeEnabled();
    expect(screen.queryByText('word 21')).not.toBeInTheDocument();
  });

  it('keeps dobble word labels inside larger image tiles', async () => {
    const user = userEvent.setup();
    const words = [
      'police_officer',
      'firefighter',
      'construction_worker',
      'veterinarian',
      'astronaut',
      'photographer',
      'librarian',
      'scientist',
      'chef',
      'pilot',
      'farmer',
      'doctor',
      'teacher',
    ];
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), words.join(', '));
    await user.click(screen.getByRole('button', { name: /도블 카드/i }));

    const firstCard = screen.getByLabelText('도블 카드 1');
    const symbols = Array.from(firstCard.querySelectorAll<HTMLElement>('.dobble-symbol'));
    const firstLongLabel = within(firstCard).getByText('police officer');

    expect(firstLongLabel.closest('.dobble-symbol-image')).not.toBeNull();
    expect(symbols).not.toHaveLength(0);
    symbols.forEach((symbol) => {
      const x = Number.parseFloat(symbol.style.getPropertyValue('--symbol-x'));
      const y = Number.parseFloat(symbol.style.getPropertyValue('--symbol-y'));
      const size = Number.parseFloat(symbol.style.getPropertyValue('--symbol-size'));
      const radius = size / 2;

      expect(size).toBeGreaterThanOrEqual(36);
      expect(x - radius).toBeGreaterThanOrEqual(8);
      expect(x + radius).toBeLessThanOrEqual(92);
      expect(y - radius).toBeGreaterThanOrEqual(8);
      expect(y + radius).toBeLessThanOrEqual(92);
    });
  });

  it('rotates dobble symbols inward with small deterministic variation', async () => {
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

    const firstCard = screen.getByLabelText('도블 카드 1');
    const rotations = Array.from(firstCard.querySelectorAll<HTMLElement>('.dobble-symbol')).map(
      (symbol) => symbol.style.getPropertyValue('--symbol-rotate'),
    );

    expect(rotations).toEqual(['128deg', '221deg', '309deg', '48deg']);
  });

  it('places dobble image symbols without overlapping each other', async () => {
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

    const cards = screen.getAllByLabelText(/도블 카드 \d+/);
    const overlaps = cards.flatMap((card, cardIndex) => {
      const symbols = Array.from(card.querySelectorAll<HTMLElement>('.dobble-symbol')).map(
        (symbol, symbolIndex) => {
          const x = Number.parseFloat(symbol.style.getPropertyValue('--symbol-x'));
          const y = Number.parseFloat(symbol.style.getPropertyValue('--symbol-y'));
          const scale = Number.parseFloat(symbol.style.getPropertyValue('--symbol-scale') || '1');
          const size =
            Number.parseFloat(symbol.style.getPropertyValue('--symbol-size')) || 35 * scale;

          return { cardIndex, symbolIndex, x, y, size };
        },
      );

      return findDobbleSymbolOverlaps(symbols);
    });

    expect(overlaps).toEqual([]);
  });

  it('lets teachers switch dobble cards between image and word display modes', async () => {
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

    const displayMode = screen.getByRole('group', { name: '도블 표시 방식' });
    const firstCard = screen.getByLabelText('도블 카드 1');

    expect(within(displayMode).getByRole('button', { name: /사진\+단어/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(firstCard).toHaveAttribute('data-display-mode', 'image-word');
    expect(within(firstCard).getByText('apple').closest('.dobble-symbol-image')).not.toBeNull();

    await user.click(within(displayMode).getByRole('button', { name: /사진만/i }));

    expect(firstCard).toHaveAttribute('data-display-mode', 'image');
    expect(within(firstCard).queryByText('apple')).not.toBeInTheDocument();
    expect(firstCard.querySelector('.dobble-symbol-image')).not.toBeNull();

    await user.click(within(displayMode).getByRole('button', { name: /단어만/i }));

    expect(firstCard).toHaveAttribute('data-display-mode', 'word');
    expect(within(firstCard).getByText('apple').closest('.dobble-word-symbol')).not.toBeNull();
    expect(firstCard.querySelector('.dobble-symbol-image')).toBeNull();
  });

  it('summarizes dobble readiness without exposing internal word coverage', async () => {
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
      'uniform',
      'victor',
    ];
    window.localStorage.setItem(
      'worksheet-maker-workspace-v1',
      JSON.stringify({
        wordInput: words.join(', '),
        imageMap: {
          alpha: 'data:image/png;base64,one',
          bravo: 'data:image/png;base64,two',
        },
      }),
    );
    render(<App />);

    await user.click(screen.getByRole('button', { name: /도블 카드/i }));
    const planPanel = screen.getByRole('region', { name: '도블 생성 방식' });

    expect(
      within(planPanel).getByText('사진 19개 필요 · 부족한 사진은 첫 글자로 대체됨'),
    ).toBeInTheDocument();
    expect(within(planPanel).getByText('단어 1개는 카드에 안 들어감')).toBeInTheDocument();
    expect(within(planPanel).queryByText('자세히 보기')).not.toBeInTheDocument();
    expect(within(planPanel).queryByText(/사진 2\/21개 준비/i)).not.toBeInTheDocument();
    expect(within(planPanel).queryByText('사용 단어 21개 보기')).not.toBeInTheDocument();
    expect(within(planPanel).queryByText(/제외: victor/i)).not.toBeInTheDocument();
  });

  it('keeps dobble output actions at the end of the settings rail', async () => {
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

    const rail = screen.getByRole('complementary', { name: '자료 설정' });
    const planPanel = within(rail).getByRole('region', { name: '도블 생성 방식' });
    const actionBar = within(rail).getByRole('group', { name: '출력 작업' });
    const wordEditButton = within(rail).getByRole('button', { name: '단어 수정' });
    const settingsButton = within(rail).getByRole('button', { name: /학급 정보 수정/i });
    const displayMode = within(rail).getByRole('group', { name: '도블 표시 방식' });
    expect(within(planPanel).getByText('카드 13장 · 카드당 단어 4개')).toBeInTheDocument();
    expect(displayMode).toBeInTheDocument();
    expect(
      within(planPanel).queryByText(
        '카드 13장 · 카드당 단어 4개 · 사진 0/13개 준비 · 첫 글자 13개 대체',
      ),
    ).not.toBeInTheDocument();
    expect(
      settingsButton.compareDocumentPosition(wordEditButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      wordEditButton.compareDocumentPosition(displayMode) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      displayMode.compareDocumentPosition(actionBar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const exportButton = within(actionBar).getByRole('button', { name: 'PPTX 다운로드' });
    const printButton = within(actionBar).getByRole('button', { name: '미리보기 인쇄' });
    expect(within(actionBar).getByText('출력')).toBeInTheDocument();
    expect(exportButton).toBeEnabled();
    expect(
      exportButton.compareDocumentPosition(printButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('explains when dobble cards will use initials instead of missing photos', async () => {
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
    const planPanel = screen.getByRole('region', { name: '도블 생성 방식' });

    expect(
      within(planPanel).getByText('사진 13개 필요 · 부족한 사진은 첫 글자로 대체됨'),
    ).toBeInTheDocument();

    const displayMode = screen.getByRole('group', { name: '도블 표시 방식' });
    await user.click(within(displayMode).getByRole('button', { name: /단어만/i }));

    expect(
      within(planPanel).queryByText('사진 13개 필요 · 부족한 사진은 첫 글자로 대체됨'),
    ).not.toBeInTheDocument();
  });

  it('shows spinner feedback and disables bulk photo search while loading', async () => {
    const user = userEvent.setup();
    const photoSearch = createDeferredResponse({
      query: 'cat',
      provider: 'auto',
      results: [
        {
          id: 'openverse:cat-1',
          title: 'Cat one',
          image_url: 'https://example.com/cat-one.jpg',
          thumbnail_url: 'https://example.com/cat-one-thumb.jpg',
          source_url: 'https://openverse.org/image/cat-1',
          provider: 'openverse',
        },
      ],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => photoSearch.promise),
    );

    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat');
    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));

    const loadingButton = screen.getByRole('button', { name: /사진 전체 검색 중/i });
    expect(loadingButton).toBeDisabled();
    expect(loadingButton.querySelector('.button-spinner')).not.toBeNull();

    photoSearch.resolve();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '사진 전체 찾기' })).toBeEnabled(),
    );
  });

  it('shows spinner feedback and disables export while generating a file', async () => {
    const user = userEvent.setup();
    const download = createDeferredBlobResponse();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => download.promise),
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:download'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'DOCX 다운로드' }));

    const loadingButton = screen.getByRole('button', { name: /파일 생성 중/i });
    expect(loadingButton).toBeDisabled();
    expect(loadingButton.querySelector('.button-spinner')).not.toBeNull();

    download.resolve();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'DOCX 다운로드' })).toBeEnabled(),
    );
  });

  it('disables downloads that would generate empty materials', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));

    const wordSearchExport = screen.getByRole('button', { name: 'DOCX 다운로드' });
    expect(wordSearchExport).toBeDisabled();
    expect(screen.getByText('단어를 입력하면 다운로드할 수 있습니다.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();
    expect(screen.getByText('단어를 입력하면 다운로드할 수 있습니다.')).toBeInTheDocument();
  });

  it('disables flicker download when every slide template is turned off', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));
    const templatePicker = screen.getByRole('group', { name: /슬라이드 양식/i });

    await user.click(within(templatePicker).getByRole('button', { name: '단어' }));
    await user.click(within(templatePicker).getByRole('button', { name: '사진' }));
    await user.click(within(templatePicker).getByRole('button', { name: '단어+사진' }));

    expect(screen.getAllByText('슬라이드 양식을 하나 이상 선택하세요.')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();
  });

  it('requires prepared photos before exporting dobble in image-only mode', async () => {
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
    await user.click(
      within(screen.getByRole('group', { name: '도블 표시 방식' })).getByRole('button', {
        name: /사진만/i,
      }),
    );

    expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();
    expect(screen.getByText(/사진만 카드에는 사진이 모두 필요합니다/i)).toBeInTheDocument();
  });

  it('marks print as material-only before opening the browser print dialog', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    render(<App />);

    await user.click(screen.getByRole('button', { name: '미리보기 인쇄' }));

    expect(document.body).toHaveAttribute('data-print-target', 'material');
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('explains the minimum safe dobble word count before enough words are entered', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'alpha, bravo, charlie');
    await user.click(screen.getByRole('button', { name: /도블 카드/i }));
    const planPanel = screen.getByRole('region', { name: '도블 생성 방식' });

    expect(screen.queryByText('카드당 그림 수')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '도블 표시 방식' })).not.toBeInTheDocument();
    expect(within(planPanel).getByText('단어 2개 더 필요')).toBeInTheDocument();
    expect(within(planPanel).getByText('현재 3개 · 최소 5개')).toBeInTheDocument();
    expect(
      within(planPanel).queryByText(/단어 7개를 맞추면 가장 작은 완전 세트/i),
    ).not.toBeInTheDocument();
    const rail = screen.getByRole('complementary', { name: '자료 설정' });
    expect(within(rail).getByRole('button', { name: '미리보기 인쇄' })).toBeDisabled();
    expect(within(rail).getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();
  });

  it('explains dobble with only teacher-facing concepts', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /도블 카드/i }));
    const planPanel = screen.getByRole('region', { name: '도블 생성 방식' });
    await user.click(within(planPanel).getByRole('button', { name: '도블 설명 보기' }));

    const dialog = screen.getByRole('dialog', { name: '도블 카드 설명' });
    expect(
      within(dialog).getByText('카드 두 장에서 똑같이 들어 있는 그림 하나를 찾는 게임입니다.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('카드 수와 카드당 단어 수는 단어 수에 맞춰 자동으로 정합니다.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('사진이 부족하면 그 단어는 첫 글자로 표시됩니다.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/완전 세트|축소 세트|프로젝트 평면/i),
    ).not.toBeInTheDocument();
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

  it('summarizes photo readiness next to the bulk photo action', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: 'cat',
            provider: 'auto',
            results: [
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
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat, dog');

    expect(screen.getByText('사진 0/2 준비됨')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));
    await waitFor(() => expect(screen.getByText('사진 2/2 준비됨')).toBeInTheDocument());
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
    const firstRow = within(photoList).getByText('토끼').closest('.word-media-row');
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
    expect(within(firstRow as HTMLElement).getByText('사진 선택됨')).toBeInTheDocument();
    expect(within(firstRow as HTMLElement).queryByText(/확인 필요/)).not.toBeInTheDocument();

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
    const firstRow = within(photoList).getByText('토끼').closest('.word-media-row');
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
    const catRow = within(photoList).getByText('cat').closest('.word-media-row');
    const dogRow = within(photoList).getByText('dog').closest('.word-media-row');
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
    const catRow = within(photoList).getByText('cat').closest('.word-media-row');
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
    const catRow = within(photoList).getByText('cat').closest('.word-media-row');
    await user.click(within(catRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /cat 사진 선택/i });
    expect(within(dialog).queryByText('Cat three')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '결과 더 보기' }));
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
    const turtleRow = within(photoList).getByText('거북이').closest('.word-media-row');
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
    await user.click(within(dialog).getByRole('button', { name: '새 검색으로 바꾸기' }));
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
    const turtleRow = within(photoList).getByText('거북이').closest('.word-media-row');
    await user.click(within(turtleRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /거북이 사진 선택/i });

    expect(within(dialog).getByLabelText('사진 검색어')).toHaveValue('turtle');
  });

  it('does not describe prepared photos as still needing confirmation', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: 'cat',
            provider: 'auto',
            results: [
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
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat');
    await user.click(screen.getByRole('button', { name: '사진 전체 찾기' }));

    await waitFor(() => expect(screen.getByText('사진 선택됨')).toBeInTheDocument());
    expect(screen.queryByText(/확인 필요/)).not.toBeInTheDocument();
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
    const catRow = within(photoList).getByText('cat').closest('.word-media-row');
    expect(within(catRow as HTMLElement).getByRole('img', { name: 'cat' })).toHaveAttribute(
      'src',
      'https://example.com/cat-one.jpg',
    );

    await user.click(within(catRow as HTMLElement).getByRole('button', { name: '다른 사진' }));

    const dialog = await screen.findByRole('dialog', { name: /cat 사진 선택/i });
    expect(within(dialog).getByText('Cat two')).toBeInTheDocument();
  });
});

function findDobbleSymbolOverlaps(
  symbols: Array<{
    cardIndex: number;
    symbolIndex: number;
    x: number;
    y: number;
    size: number;
  }>,
) {
  const overlaps: Array<{ cardIndex: number; symbols: [number, number] }> = [];

  for (let i = 0; i < symbols.length; i += 1) {
    for (let j = i + 1; j < symbols.length; j += 1) {
      const centerDistance = Math.hypot(symbols[i].x - symbols[j].x, symbols[i].y - symbols[j].y);
      const minimumGap = (symbols[i].size + symbols[j].size) / 2 + 2;

      if (centerDistance < minimumGap) {
        overlaps.push({
          cardIndex: symbols[i].cardIndex,
          symbols: [symbols[i].symbolIndex, symbols[j].symbolIndex],
        });
      }
    }
  }

  return overlaps;
}

function createDeferredResponse(body: unknown) {
  let resolvePromise: () => void = () => undefined;
  const promise = new Promise<{
    ok: boolean;
    json: () => Promise<unknown>;
  }>((resolve) => {
    resolvePromise = () =>
      resolve({
        ok: true,
        json: () => Promise.resolve(body),
      });
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}

function createDeferredBlobResponse() {
  let resolvePromise: () => void = () => undefined;
  const promise = new Promise<{
    ok: boolean;
    blob: () => Promise<Blob>;
  }>((resolve) => {
    resolvePromise = () =>
      resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['ok'])),
      });
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}
