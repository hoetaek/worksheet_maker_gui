import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Grid3X3,
  HelpCircle,
  Images,
  Layers3,
  Menu,
  Minus,
  Pencil,
  Plus,
  Printer,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { selectDobblePlan } from './lib/dobble';
import {
  downloadDobblePptx,
  downloadFlickerPptx,
  downloadWordSearchDocx,
  downloadWorksheetDocx,
} from './lib/downloads';
import {
  searchBackendImageResults,
  type ImageCandidate,
  type ImageSearchResult,
} from './lib/imageSearch';
import { buildFlickerSequence, buildWorksheetCells, type FlickerTemplate } from './lib/materials';
import { createWordSearch, type FillerMode, type WordSearchDifficulty } from './lib/wordSearch';
import { buildKeywordRows, detectLanguage, parseWords, wordCountStatus } from './lib/words';

type ToolId = 'word-search' | 'worksheet' | 'flicker' | 'dobble';
type RouteId = 'home' | ToolId;

type ImageMap = Record<string, string>;
type ImageCandidateMap = Record<string, ImageCandidate[]>;
type ImageSearchQueryMap = Record<string, string>;
type QuizMap = Record<string, string>;
type DobbleDisplayMode = 'image-word' | 'image' | 'word';
type WordSearchPuzzleState = ReturnType<typeof createWordSearch> | Error | null;

type Toast = {
  id: number;
  text: string;
};

type ImagePickerState = {
  word: string;
  candidates: ImageCandidate[];
  searchedQuery: string;
};

type WorkspaceDraft = {
  activeTool?: ToolId;
  wordInput?: string;
  imageMap?: ImageMap;
  quizMap?: QuizMap;
  wordCart?: string[];
  grade?: number;
  klass?: number;
  imageCandidatesByWord?: ImageCandidateMap;
  imageSearchQueryByWord?: ImageSearchQueryMap;
};

const TOOL_OPTIONS: Array<{
  id: ToolId;
  label: string;
  description: string;
  icon: typeof Search;
  accent: 'develop' | 'preview' | 'ship' | 'neutral';
}> = [
  {
    id: 'word-search',
    label: '낱말 찾기',
    description: '퍼즐 생성',
    icon: Search,
    accent: 'develop',
  },
  {
    id: 'worksheet',
    label: '단어 활동지',
    description: '인쇄 자료',
    icon: FileText,
    accent: 'neutral',
  },
  {
    id: 'flicker',
    label: '단어 깜빡이',
    description: 'PPT 슬라이드',
    icon: Images,
    accent: 'preview',
  },
  { id: 'dobble', label: '도블 카드', description: '게임 카드', icon: Layers3, accent: 'ship' },
];

const SAMPLE_WORDS_BY_TOOL: Record<ToolId, string> = {
  'word-search': '토끼, 거북이, 사자, 강아지, 고양이, 코끼리',
  worksheet: '토끼, 거북이, 사자, 강아지, 고양이, 코끼리',
  flicker: 'apple, banana, cat, dog, milk, pencil',
  dobble:
    'apple, banana, cherry, date, elderberry, fig, grape, honeydew, kiwi, lemon, mango, nectarine, orange',
};
const FLICKER_TEMPLATES: Array<{ id: FlickerTemplate; label: string }> = [
  { id: 'word', label: '단어' },
  { id: 'image', label: '사진' },
  { id: 'word-image', label: '단어+사진' },
  { id: 'blank', label: '빈 슬라이드' },
];

const IMAGE_SEARCH_LIMIT = 8;
const IMAGE_EXPANDED_SEARCH_LIMIT = 12;
const WORKSPACE_STORAGE_KEY = 'worksheet-maker-workspace-v1';
const WORD_SEARCH_MIN_SIZE = 5;
const WORD_SEARCH_MAX_SIZE = 28;
const EMPTY_MATERIAL_REASON = '단어를 입력하면 다운로드할 수 있습니다.';
const WORD_SEARCH_STUDENT_INSTRUCTION = '그림을 보고 낱말을 찾아 동그라미 하세요.';
const WORKSHEET_STUDENT_INSTRUCTION = '그림을 보고 단어를 읽은 뒤 빈칸에 따라 쓰세요.';

const ROUTE_PATHS: Record<RouteId, string> = {
  home: '/',
  'word-search': '/word-search',
  worksheet: '/worksheet',
  flicker: '/flicker',
  dobble: '/dobble',
};

const WORD_SEARCH_DIFFICULTIES: Array<{
  value: WordSearchDifficulty;
  label: string;
  description: string;
}> = [
  { value: 1, label: '쉬움', description: '가로·세로' },
  { value: 2, label: '보통', description: '역방향 포함' },
  { value: 3, label: '어려움', description: '대각선 포함' },
  { value: 4, label: '매우 어려움', description: '모든 방향' },
];

const FILLER_MODE_OPTIONS: Array<{
  value: FillerMode;
  label: string;
  description: string;
}> = [
  { value: 'easy', label: '쉽게 찾기', description: '낱말 글자를 덜 섞어요' },
  { value: 'balanced', label: '균형 있게', description: '기본 추천' },
  { value: 'overlap', label: '더 어렵게', description: '비슷한 글자를 섞어요' },
];

const DOBBLE_DISPLAY_OPTIONS: Array<{
  value: DobbleDisplayMode;
  label: string;
  description: string;
}> = [
  { value: 'image-word', label: '사진+단어', description: '확인용 기본값' },
  { value: 'image', label: '사진만', description: '놀이 카드 중심' },
  { value: 'word', label: '단어만', description: '읽기 활동 중심' },
];

function App() {
  const [workspaceDraft] = useState(readWorkspaceDraft);
  const [currentRoute, setCurrentRoute] = useState<RouteId>(() =>
    routeFromPath(window.location.pathname),
  );
  const [activeTool, setActiveTool] = useState<ToolId>(() => {
    const initialRoute = routeFromPath(window.location.pathname);
    return initialRoute === 'home' ? (workspaceDraft.activeTool ?? 'word-search') : initialRoute;
  });
  const [wordInput, setWordInput] = useState(
    workspaceDraft.wordInput ?? SAMPLE_WORDS_BY_TOOL['word-search'],
  );
  const [imageMap, setImageMap] = useState<ImageMap>(workspaceDraft.imageMap ?? {});
  const [quizMap, setQuizMap] = useState<QuizMap>(workspaceDraft.quizMap ?? {});
  const [wordCart, setWordCart] = useState<string[]>(workspaceDraft.wordCart ?? []);
  const [grade, setGrade] = useState(workspaceDraft.grade ?? 3);
  const [klass, setKlass] = useState(workspaceDraft.klass ?? 1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wordDrawerOpen, setWordDrawerOpen] = useState(false);
  const [wordSearchSize, setWordSearchSize] = useState(15);
  const [wordSearchDifficulty, setWordSearchDifficulty] = useState<WordSearchDifficulty>(1);
  const [wordSearchFillerMode, setWordSearchFillerMode] = useState<FillerMode>('balanced');
  const [wordSearchUppercase, setWordSearchUppercase] = useState(false);
  const [wordSearchShowAnswer, setWordSearchShowAnswer] = useState(false);
  const [worksheetColumns, setWorksheetColumns] = useState(5);
  const [worksheetSyllables, setWorksheetSyllables] = useState(false);
  const [flickerTemplates, setFlickerTemplates] = useState<FlickerTemplate[]>([
    'word',
    'image',
    'word-image',
  ]);
  const [dobbleDisplayMode, setDobbleDisplayMode] = useState<DobbleDisplayMode>('image-word');
  const [dobbleInfoOpen, setDobbleInfoOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [imageLoadingWord, setImageLoadingWord] = useState<string | null>(null);
  const [allImagesLoading, setAllImagesLoading] = useState(false);
  const [imagePicker, setImagePicker] = useState<ImagePickerState | null>(null);
  const [imageCandidatesByWord, setImageCandidatesByWord] = useState<ImageCandidateMap>(
    workspaceDraft.imageCandidatesByWord ?? {},
  );
  const [imageSearchQueryByWord, setImageSearchQueryByWord] = useState<ImageSearchQueryMap>(
    workspaceDraft.imageSearchQueryByWord ?? {},
  );
  const toastIdRef = useRef(0);

  const words = useMemo(() => parseWords(wordInput), [wordInput]);
  const keywordRows = useMemo(() => buildKeywordRows(words, '', IMAGE_SEARCH_LIMIT), [words]);
  const preparedImageCount = words.filter((word) => Boolean(imageMap[word])).length;
  const language = detectLanguage(words);
  const activeToolConfig = TOOL_OPTIONS.find((tool) => tool.id === activeTool) ?? TOOL_OPTIONS[0];
  const wordSearchDifficultyIndex = WORD_SEARCH_DIFFICULTIES.findIndex(
    (item) => item.value === wordSearchDifficulty,
  );
  const currentWordSearchDifficulty =
    WORD_SEARCH_DIFFICULTIES[wordSearchDifficultyIndex] ?? WORD_SEARCH_DIFFICULTIES[0];
  const wordSearchPuzzle = useMemo<WordSearchPuzzleState>(() => {
    if (words.length === 0) {
      return null;
    }

    try {
      return createWordSearch({
        words,
        width: wordSearchSize,
        height: wordSearchSize,
        difficulty: wordSearchDifficulty,
        fillerMode: wordSearchFillerMode,
        uppercase: wordSearchUppercase,
        seed: 20260502,
      });
    } catch (error) {
      return error instanceof Error ? error : new Error('퍼즐을 만들 수 없습니다.');
    }
  }, [wordSearchDifficulty, wordSearchFillerMode, wordSearchSize, wordSearchUppercase, words]);
  const generatedWordSearchPuzzle =
    wordSearchPuzzle instanceof Error ? null : (wordSearchPuzzle ?? null);
  const worksheet = useMemo(
    () => buildWorksheetCells(words, worksheetColumns),
    [worksheetColumns, words],
  );
  const worksheetShowsLetterSplit = worksheetSyllables && language !== 'korean';
  const flickerSequence = useMemo(
    () => buildFlickerSequence(flickerTemplates, words),
    [flickerTemplates, words],
  );
  const flickerTemplateSummary = flickerTemplates
    .map((template) => FLICKER_TEMPLATES.find((item) => item.id === template)?.label)
    .filter((label): label is string => Boolean(label))
    .join(' · ');
  const hasSelectedFlickerTemplate = flickerTemplates.length > 0;
  const dobbleDetails = useMemo(
    () => getDobblePlanDetails(words, imageMap, dobbleDisplayMode),
    [dobbleDisplayMode, imageMap, words],
  );

  useEffect(() => {
    document.documentElement.dataset.appRoute = currentRoute === 'home' ? 'home' : 'material';

    return () => {
      delete document.documentElement.dataset.appRoute;
    };
  }, [currentRoute]);

  useEffect(() => {
    writeWorkspaceDraft({
      activeTool,
      wordInput,
      imageMap: pickExistingWordEntries(imageMap, words),
      quizMap: pickExistingWordEntries(quizMap, words),
      wordCart,
      grade,
      klass,
      imageCandidatesByWord: pickExistingWordEntries(imageCandidatesByWord, words),
      imageSearchQueryByWord: pickExistingWordEntries(imageSearchQueryByWord, words),
    });
  }, [
    activeTool,
    grade,
    imageCandidatesByWord,
    imageMap,
    imageSearchQueryByWord,
    klass,
    quizMap,
    wordCart,
    wordInput,
    words,
  ]);

  useEffect(() => {
    function handlePopState() {
      const nextRoute = routeFromPath(window.location.pathname);
      setCurrentRoute(nextRoute);
      if (nextRoute !== 'home') {
        setActiveTool(nextRoute);
      }
      setMobileNavOpen(false);
      setWordDrawerOpen(false);
      setDobbleInfoOpen(false);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigateToRoute(route: RouteId) {
    const nextPath = ROUTE_PATHS[route];
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }

    setCurrentRoute(route);
    if (route !== 'home') {
      setActiveTool(route);
    }
    setMobileNavOpen(false);
    setWordDrawerOpen(false);
    setDobbleInfoOpen(false);
  }

  function notify(text: string) {
    toastIdRef.current += 1;
    const nextToast = { id: toastIdRef.current, text };
    setToast(nextToast);
    window.setTimeout(() => {
      setToast((current) => (current?.id === nextToast.id ? null : current));
    }, 2200);
  }

  function updateImage(word: string, value: string) {
    setImageMap((current) => ({ ...current, [word]: value }));
  }

  function updateQuizHint(word: string, value: string) {
    setQuizMap((current) => ({ ...current, [word]: value }));
  }

  function addCurrentWordsToCart() {
    if (words.length === 0) {
      notify('담을 단어를 먼저 입력해주세요.');
      return;
    }

    setWordCart((current) => mergeWordLists(current, words));
    notify('현재 단어를 담았습니다.');
  }

  function addCartWordToInput(word: string) {
    setWordInput((current) => mergeWordLists(parseWords(current), [word]).join(', '));
  }

  function removeCartWord(word: string) {
    setWordCart((current) => current.filter((item) => item !== word));
  }

  function applyImageCandidates(word: string, result: ImageSearchResult): boolean {
    const { candidates, searchedQuery } = result;
    if (candidates.length === 0) {
      return false;
    }

    cacheImageCandidates(word, candidates, searchedQuery);
    updateImage(word, candidates[0].imageUrl);
    return true;
  }

  function cacheImageCandidates(word: string, candidates: ImageCandidate[], searchedQuery: string) {
    setImageCandidatesByWord((current) => ({ ...current, [word]: candidates }));
    setImageSearchQueryByWord((current) => ({ ...current, [word]: searchedQuery }));
    setImagePicker((current) =>
      current?.word === word ? { ...current, candidates, searchedQuery } : current,
    );
  }

  async function copyWords() {
    await navigator.clipboard.writeText(words.join(', '));
    notify('단어 목록을 복사했습니다.');
  }

  function runDownload(action: () => Promise<void>): Promise<void> {
    return action()
      .then(() => notify('파일 다운로드를 시작했습니다.'))
      .catch((error: unknown) => {
        notify(error instanceof Error ? error.message : '파일을 만들 수 없습니다.');
      });
  }

  function printMaterialPreview() {
    document.body.dataset.printTarget = 'material';
    window.print();
    window.setTimeout(() => {
      if (document.body.dataset.printTarget === 'material') {
        delete document.body.dataset.printTarget;
      }
    }, 250);
  }

  function exportDobble() {
    return runDownload(() =>
      downloadDobblePptx(
        dobbleDetails.indexes.map((card) =>
          card.map((index) => ({
            word: words[index],
            image: imageMap[words[index]] || undefined,
          })),
        ),
        dobbleDetails.picturesPerCard,
        dobbleDisplayMode,
      ),
    );
  }

  function decreaseWordSearchDifficulty() {
    setWordSearchDifficulty(
      WORD_SEARCH_DIFFICULTIES[Math.max(wordSearchDifficultyIndex - 1, 0)].value,
    );
  }

  function increaseWordSearchDifficulty() {
    setWordSearchDifficulty(
      WORD_SEARCH_DIFFICULTIES[
        Math.min(wordSearchDifficultyIndex + 1, WORD_SEARCH_DIFFICULTIES.length - 1)
      ].value,
    );
  }

  function toggleFlickerTemplate(template: FlickerTemplate) {
    setFlickerTemplates((current) => {
      if (current.includes(template)) {
        return current.filter((item) => item !== template);
      }

      return [...current, template];
    });
  }

  async function findImage(row: { word: string; keyword: string }) {
    setImageLoadingWord(row.word);
    try {
      const result = await searchBackendImageResults(row.keyword, {
        limit: IMAGE_SEARCH_LIMIT,
        provider: 'auto',
      });
      if (result.candidates.length === 0) {
        notify('검색된 사진이 없습니다.');
        return;
      }
      applyImageCandidates(row.word, result);
      notify(`${row.word} 첫 사진을 넣었습니다.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '사진 검색에 실패했습니다.');
    } finally {
      setImageLoadingWord(null);
    }
  }

  async function findAllImages() {
    const missingRows = keywordRows.filter((row) => !imageMap[row.word]);

    if (missingRows.length === 0) {
      notify(
        keywordRows.length === 0
          ? '사진을 찾을 단어를 입력해주세요.'
          : '이미 모든 단어에 사진이 있습니다.',
      );
      return;
    }

    setAllImagesLoading(true);
    try {
      const settled = await Promise.allSettled(
        missingRows.map(async (row) => ({
          row,
          result: await searchBackendImageResults(row.keyword, {
            limit: IMAGE_SEARCH_LIMIT,
            provider: 'auto',
          }),
        })),
      );
      let foundCount = 0;
      let emptyCount = 0;
      let failedCount = 0;

      for (const result of settled) {
        if (result.status === 'rejected') {
          failedCount += 1;
          continue;
        }

        if (applyImageCandidates(result.value.row.word, result.value.result)) {
          foundCount += 1;
        } else {
          emptyCount += 1;
        }
      }

      if (foundCount === 0) {
        notify(failedCount > 0 ? '사진 검색에 실패했습니다.' : '검색된 사진이 없습니다.');
        return;
      }

      const misses = emptyCount + failedCount;
      notify(
        misses > 0
          ? `사진 ${foundCount}개를 넣었습니다. ${misses}개는 찾지 못했습니다.`
          : `사진 ${foundCount}개를 넣었습니다.`,
      );
    } finally {
      setAllImagesLoading(false);
    }
  }

  function openImagePicker(word: string) {
    const candidates = imageCandidatesByWord[word] ?? [];
    if (candidates.length === 0) {
      notify('먼저 사진을 찾아주세요.');
      return;
    }

    setImagePicker({
      word,
      candidates,
      searchedQuery: imageSearchQueryByWord[word] ?? word,
    });
  }

  async function searchImageCandidates(word: string, query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      notify('검색어를 입력해주세요.');
      return;
    }

    setImageLoadingWord(word);
    try {
      const result = await searchBackendImageResults(trimmedQuery, {
        limit: IMAGE_SEARCH_LIMIT,
        provider: 'auto',
      });
      if (result.candidates.length === 0) {
        notify('검색된 사진이 없습니다.');
        return;
      }

      cacheImageCandidates(word, result.candidates, result.searchedQuery);
      notify(`${result.searchedQuery} 사진 후보를 찾았습니다.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '사진 검색에 실패했습니다.');
    } finally {
      setImageLoadingWord(null);
    }
  }

  async function findMoreImages(word: string, query = word) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      notify('검색어를 입력해주세요.');
      return;
    }

    setImageLoadingWord(word);
    try {
      const result = await searchBackendImageResults(trimmedQuery, {
        limit: IMAGE_EXPANDED_SEARCH_LIMIT,
        provider: 'auto',
      });
      const currentCandidates = imageCandidatesByWord[word] ?? [];
      const mergedCandidates = mergeImageCandidates(currentCandidates, result.candidates);
      if (mergedCandidates.length === currentCandidates.length) {
        notify('추가 사진을 찾지 못했습니다.');
        return;
      }

      cacheImageCandidates(word, mergedCandidates, result.searchedQuery);
      notify(`${result.searchedQuery} 사진 후보를 더 찾았습니다.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '사진 검색에 실패했습니다.');
    } finally {
      setImageLoadingWord(null);
    }
  }

  function uploadImage(word: string, file: File | null) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        updateImage(word, reader.result);
        notify(`${word} 사진을 추가했습니다.`);
      }
    });
    reader.readAsDataURL(file);
  }

  function renderWordSetupPanel(variant: 'home' | 'drawer') {
    const isHome = variant === 'home';

    if (isHome) {
      return (
        <section className="word-prep-home" aria-label="단어 준비 홈">
          <div className="word-prep-hero">
            <div>
              <p className="mono-label">준비</p>
              <h2>학습 단어 준비</h2>
            </div>
            <div className="word-prep-status">
              <p className="word-prep-summary">
                단어 {words.length}개 · 사진 {preparedImageCount}/{words.length} 준비
              </p>
              <button
                className="secondary-button settings-button"
                type="button"
                aria-label="학급 정보 수정"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={15} />
                학급 정보
              </button>
            </div>
          </div>

          <div className="word-prep-grid">
            <section className="word-prep-panel word-entry-panel" aria-label="단어 입력">
              <div className="word-prep-panel-heading">
                <div>
                  <span className="control-kicker">단어</span>
                  <h3>목록 만들기</h3>
                </div>
              </div>
              <label className="field-label" htmlFor="word-input">
                단어 목록
              </label>
              <textarea
                id="word-input"
                className="word-area"
                value={wordInput}
                onChange={(event) => setWordInput(event.target.value)}
                spellCheck={false}
              />

              <div className="word-action-panel" role="group" aria-label="단어 빠른 작업">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setWordInput(SAMPLE_WORDS_BY_TOOL[activeTool])}
                >
                  <Grid3X3 size={15} />
                  예시 단어 넣기
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    void copyWords();
                  }}
                  disabled={words.length === 0}
                >
                  <Copy size={15} />
                  단어 복사
                </button>
              </div>
            </section>

            <section
              className="word-prep-panel word-media-prep-panel"
              aria-label="단어별 사진과 힌트"
            >
              <div className="word-prep-panel-heading">
                <div>
                  <span className="control-kicker">단어별 준비</span>
                  <h3>사진과 힌트</h3>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    void findAllImages();
                  }}
                  disabled={words.length === 0 || allImagesLoading}
                >
                  {allImagesLoading ? <ButtonSpinner /> : <Images size={16} />}
                  {allImagesLoading ? '검색 중' : '사진 전체 찾기'}
                </button>
              </div>

              <div className="word-media-list" aria-label="단어별 사진과 힌트 목록">
                {keywordRows.length === 0 ? (
                  <EmptyState text="단어를 입력하면 사진과 힌트 행이 만들어집니다." />
                ) : (
                  keywordRows.map((row) => (
                    <div className="word-media-row" key={row.word}>
                      <ImagePreview word={row.word} imageUrl={imageMap[row.word]} />
                      <div className="word-media-main">
                        <div className="word-photo-copy">
                          <span className="word-token">{row.word}</span>
                          <span>{imageMap[row.word] ? '사진 선택됨' : '사진 없음'}</span>
                        </div>
                        <label className="word-hint-field">
                          <span className="sr-only">{row.word} 힌트</span>
                          <input
                            aria-label={`${row.word} 퀴즈 힌트`}
                            value={quizMap[row.word] ?? ''}
                            onChange={(event) =>
                              updateQuizHint(row.word, event.currentTarget.value)
                            }
                            placeholder="빈칸 힌트나 단어 설명"
                          />
                        </label>
                      </div>
                      <div className="image-controls">
                        <button
                          className="tiny-button"
                          type="button"
                          onClick={() => {
                            void findImage(row);
                          }}
                          disabled={imageLoadingWord === row.word || allImagesLoading}
                        >
                          {imageLoadingWord === row.word && <ButtonSpinner />}
                          {imageLoadingWord === row.word ? '검색 중' : '사진 찾기'}
                        </button>
                        <button
                          className="tiny-button"
                          type="button"
                          onClick={() => openImagePicker(row.word)}
                          disabled={(imageCandidatesByWord[row.word] ?? []).length === 0}
                        >
                          다른 사진
                        </button>
                        <label className="tiny-upload">
                          직접 올리기
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              uploadImage(row.word, event.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="word-prep-panel material-choice-panel" aria-label="다음 자료 선택">
              <div className="word-prep-panel-heading">
                <div>
                  <span className="control-kicker">다음</span>
                  <h3>자료 만들기</h3>
                </div>
              </div>
              <div className="material-choice-list">
                {TOOL_OPTIONS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      className={`material-choice-button accent-${tool.accent}`}
                      type="button"
                      key={tool.id}
                      aria-label={`${tool.label} 만들기`}
                      onClick={() => navigateToRoute(tool.id)}
                      disabled={words.length === 0}
                    >
                      <Icon size={16} />
                      <span>
                        <strong>{tool.label}</strong>
                        <small>{tool.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="word-cart-panel word-prep-panel" aria-label="담은 단어">
              <div className="word-cart-heading">
                <div>
                  <span className="control-kicker">보관함</span>
                  <h3>담은 단어</h3>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={addCurrentWordsToCart}
                  disabled={words.length === 0}
                >
                  현재 단어 담기
                </button>
              </div>
              {wordCart.length === 0 ? (
                <EmptyState text="현재 단어를 담아두면 다시 추가할 수 있습니다." />
              ) : (
                <div className="word-cart-list">
                  {wordCart.map((word) => (
                    <span className="word-cart-item" key={word}>
                      <button
                        className="word-cart-chip"
                        type="button"
                        aria-label={`${word} 추가`}
                        onClick={() => addCartWordToInput(word)}
                      >
                        {word}
                      </button>
                      <button
                        className="word-cart-remove"
                        type="button"
                        aria-label={`${word} 제거`}
                        onClick={() => removeCartWord(word)}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      );
    }

    return (
      <section
        className={`control-panel word-setup-panel word-setup-panel-${variant}`}
        aria-label={isHome ? '단어 준비 홈' : '입력 설정'}
      >
        <div className="panel-heading">
          <div>
            <p className="mono-label">{isHome ? '준비' : '입력'}</p>
            <h2>{isHome ? '학습 단어 준비' : '단어 수정'}</h2>
          </div>
          <div className="panel-heading-actions">
            <Badge tone={wordCountStatus(words.length).tone}>
              {wordCountStatus(words.length).label}
            </Badge>
            {isHome ? (
              <button
                className="secondary-button settings-button"
                type="button"
                aria-label="학급 정보 수정"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={15} />
                학급 정보
              </button>
            ) : (
              <button
                className="icon-button"
                type="button"
                aria-label="단어 드로어 닫기"
                onClick={() => setWordDrawerOpen(false)}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {isHome && (
          <p className="word-setup-intro">
            단어를 먼저 정하고, 필요한 사진이나 퀴즈 힌트를 준비한 뒤 상단 메뉴에서 만들 자료를
            고르세요.
          </p>
        )}

        <label className="field-label" htmlFor="word-input">
          단어 목록
        </label>
        <textarea
          id="word-input"
          className="word-area"
          value={wordInput}
          onChange={(event) => setWordInput(event.target.value)}
          spellCheck={false}
        />

        <div className="word-action-panel" role="group" aria-label="단어 빠른 작업">
          <button
            className="primary-button word-photo-search-action"
            type="button"
            onClick={() => {
              void findAllImages();
            }}
            disabled={words.length === 0 || allImagesLoading}
          >
            {allImagesLoading ? <ButtonSpinner /> : <Images size={16} />}
            {allImagesLoading ? '사진 전체 검색 중' : '사진 전체 찾기'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setWordInput(SAMPLE_WORDS_BY_TOOL[activeTool])}
          >
            <Grid3X3 size={15} />
            예시 단어 넣기
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void copyWords();
            }}
            disabled={words.length === 0}
          >
            <Copy size={15} />
            단어 복사
          </button>
          <div className="photo-readiness" aria-live="polite">
            사진 {preparedImageCount}/{words.length} 준비됨
          </div>
        </div>

        {isHome && (
          <section className="word-cart-panel" aria-label="담은 단어">
            <div className="word-cart-heading">
              <div>
                <span className="control-kicker">단어 보관함</span>
                <strong>필요한 단어 담기</strong>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={addCurrentWordsToCart}
                disabled={words.length === 0}
              >
                현재 단어 담기
              </button>
            </div>
            {wordCart.length === 0 ? (
              <EmptyState text="현재 단어를 담아두면 다른 자료를 만들 때 다시 추가할 수 있습니다." />
            ) : (
              <div className="word-cart-list">
                {wordCart.map((word) => (
                  <span className="word-cart-item" key={word}>
                    <button
                      className="word-cart-chip"
                      type="button"
                      aria-label={`${word} 추가`}
                      onClick={() => addCartWordToInput(word)}
                    >
                      {word}
                    </button>
                    <button
                      className="word-cart-remove"
                      type="button"
                      aria-label={`${word} 제거`}
                      onClick={() => removeCartWord(word)}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="word-drawer-media-section" aria-label="사진과 힌트">
          <div className="word-prep-panel-heading">
            <div>
              <span className="control-kicker">단어별 준비</span>
              <h3>사진과 힌트</h3>
            </div>
          </div>

          <div className="word-media-list" aria-label="단어별 사진">
            {keywordRows.length === 0 ? (
              <EmptyState text="단어를 입력하면 사진과 힌트 행이 만들어집니다." />
            ) : (
              keywordRows.map((row) => (
                <div className="word-media-row" key={row.word}>
                  <ImagePreview word={row.word} imageUrl={imageMap[row.word]} />
                  <div className="word-media-main">
                    <div className="word-photo-copy">
                      <span className="word-token">{row.word}</span>
                      <span>{imageMap[row.word] ? '사진 선택됨' : '사진 없음'}</span>
                    </div>
                    <label className="word-hint-field">
                      <span className="sr-only">{row.word} 힌트</span>
                      <input
                        aria-label={`${row.word} 퀴즈 힌트`}
                        value={quizMap[row.word] ?? ''}
                        onChange={(event) => updateQuizHint(row.word, event.currentTarget.value)}
                        placeholder="빈칸 힌트나 단어 설명"
                      />
                    </label>
                  </div>
                  <div className="image-controls">
                    <button
                      className="tiny-button"
                      type="button"
                      onClick={() => {
                        void findImage(row);
                      }}
                      disabled={imageLoadingWord === row.word || allImagesLoading}
                    >
                      {imageLoadingWord === row.word && <ButtonSpinner />}
                      {imageLoadingWord === row.word ? '검색 중' : '사진 찾기'}
                    </button>
                    <button
                      className="tiny-button"
                      type="button"
                      onClick={() => openImagePicker(row.word)}
                      disabled={(imageCandidatesByWord[row.word] ?? []).length === 0}
                    >
                      다른 사진
                    </button>
                    <label className="tiny-upload">
                      직접 올리기
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => uploadImage(row.word, event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    );
  }

  const wordSearchExportDisabled = !generatedWordSearchPuzzle;
  const wordSearchExportDisabledReason =
    words.length === 0
      ? EMPTY_MATERIAL_REASON
      : wordSearchPuzzle instanceof Error
        ? '퍼즐을 만들 수 없어 다운로드할 수 없습니다.'
        : undefined;
  const worksheetExportDisabledReason = words.length === 0 ? EMPTY_MATERIAL_REASON : undefined;
  const flickerExportDisabledReason =
    words.length === 0
      ? EMPTY_MATERIAL_REASON
      : hasSelectedFlickerTemplate
        ? undefined
        : '슬라이드 양식을 하나 이상 선택하세요.';

  function renderMaterialOutputActions() {
    if (activeTool === 'dobble') {
      return (
        <ActionBar
          variant="inline"
          onPrint={printMaterialPreview}
          onExport={exportDobble}
          exportLabel="PPTX 다운로드"
          exportDisabled={!dobbleDetails.canExportDobble}
          disabledReason={dobbleDetails.disabledReason}
        />
      );
    }

    if (activeTool === 'word-search') {
      return (
        <ActionBar
          variant="inline"
          onPrint={printMaterialPreview}
          onExport={() =>
            runDownload(() =>
              downloadWordSearchDocx({
                words,
                imageMap,
                puzzle: generatedWordSearchPuzzle,
                grade,
                classNumber: klass,
              }),
            )
          }
          exportLabel="DOCX 다운로드"
          exportDisabled={wordSearchExportDisabled}
          disabledReason={wordSearchExportDisabledReason}
        />
      );
    }

    if (activeTool === 'worksheet') {
      return (
        <ActionBar
          variant="inline"
          onPrint={printMaterialPreview}
          onExport={() =>
            runDownload(() =>
              downloadWorksheetDocx({
                words,
                imageMap,
                columns: worksheetColumns,
                syllables: worksheetSyllables,
                grade,
                classNumber: klass,
              }),
            )
          }
          exportLabel="DOCX 다운로드"
          exportDisabled={words.length === 0}
          disabledReason={worksheetExportDisabledReason}
        />
      );
    }

    return (
      <ActionBar
        variant="inline"
        onPrint={printMaterialPreview}
        onExport={() => runDownload(() => downloadFlickerPptx(words, imageMap, flickerTemplates))}
        exportLabel="PPTX 다운로드"
        exportDisabled={Boolean(flickerExportDisabledReason)}
        disabledReason={flickerExportDisabledReason}
        showDisabledReason={flickerExportDisabledReason === EMPTY_MATERIAL_REASON}
      />
    );
  }

  function renderPreviewTitle() {
    return activeTool === 'dobble' ? '실제 카드 미리보기' : '실제 자료 미리보기';
  }

  function renderMaterialSettingsRail() {
    const showClassInfoAction = activeTool === 'word-search' || activeTool === 'worksheet';

    function renderMaterialPlanPanel() {
      if (activeTool === 'dobble') {
        return (
          <DobblePlanPanel
            tool={activeToolConfig}
            details={dobbleDetails}
            onInfoOpen={() => setDobbleInfoOpen(true)}
          />
        );
      }

      if (activeTool === 'word-search') {
        return (
          <MaterialPlanPanel
            tool={activeToolConfig}
            statusLabel={wordSearchExportDisabled ? '단어 필요' : undefined}
            statusTone="danger"
            summary={`퍼즐 ${wordSearchSize} x ${wordSearchSize} · 단어 ${words.length}개`}
          />
        );
      }

      if (activeTool === 'worksheet') {
        return (
          <MaterialPlanPanel
            tool={activeToolConfig}
            summary={`단어 ${words.length}개 · 한 줄 ${worksheetColumns}칸`}
          />
        );
      }

      return (
        <MaterialPlanPanel
          tool={activeToolConfig}
          statusLabel={hasSelectedFlickerTemplate ? undefined : '양식 선택 필요'}
          statusTone="danger"
          summary={`슬라이드 ${flickerSequence.length}장 · ${flickerTemplateSummary || '양식 0개'}`}
        />
      );
    }

    function renderMaterialControls() {
      if (activeTool === 'dobble') {
        return (
          <DobbleDisplayControls
            canExportDobble={dobbleDetails.plan.kind !== 'unavailable'}
            displayMode={dobbleDisplayMode}
            onDisplayModeChange={setDobbleDisplayMode}
          />
        );
      }

      if (activeTool === 'word-search') {
        return (
          <WordSearchSettings
            size={wordSearchSize}
            difficultyIndex={wordSearchDifficultyIndex}
            currentDifficulty={currentWordSearchDifficulty}
            fillerMode={wordSearchFillerMode}
            uppercase={wordSearchUppercase}
            showAnswer={wordSearchShowAnswer}
            onSizeChange={setWordSearchSize}
            onDifficultyDecrease={decreaseWordSearchDifficulty}
            onDifficultyIncrease={increaseWordSearchDifficulty}
            onFillerModeChange={setWordSearchFillerMode}
            onUppercaseChange={setWordSearchUppercase}
            onShowAnswerChange={setWordSearchShowAnswer}
          />
        );
      }

      if (activeTool === 'worksheet') {
        return (
          <WorksheetSettings
            columns={worksheetColumns}
            showLetterSplit={language !== 'korean'}
            letterSplit={worksheetSyllables}
            onColumnsChange={setWorksheetColumns}
            onLetterSplitChange={setWorksheetSyllables}
          />
        );
      }

      return (
        <FlickerSettings templates={flickerTemplates} onTemplateToggle={toggleFlickerTemplate} />
      );
    }

    return (
      <aside className="material-settings-rail" role="complementary" aria-label="자료 설정">
        {renderMaterialPlanPanel()}

        <div className="material-rail-actions">
          {showClassInfoAction && (
            <button
              className="secondary-button"
              type="button"
              aria-label="학급 정보 수정"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={15} />
              학급 정보
            </button>
          )}
          <button
            className="secondary-button"
            type="button"
            onClick={() => setWordDrawerOpen(true)}
          >
            <Pencil size={15} />
            단어 수정
          </button>
        </div>

        {renderMaterialControls()}
      </aside>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand-lockup brand-home-button"
          type="button"
          aria-label="홈으로 이동"
          onClick={() => navigateToRoute('home')}
        >
          <span className="mark" aria-hidden="true">
            <Sparkles size={16} />
          </span>
          <span className="brand-copy" aria-hidden="true">
            <span className="mono-label">학습 자료 제작기</span>
            <span className="brand-title">학습 자료 제작 스튜디오</span>
          </span>
        </button>
        <h1 className="sr-only">학습 자료 제작 스튜디오</h1>

        <button
          className="icon-button mobile-menu"
          type="button"
          aria-label="도구 메뉴 열기"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <Menu size={18} />
        </button>

        <nav className={`tool-tabs ${mobileNavOpen ? 'is-open' : ''}`} aria-label="도구">
          {TOOL_OPTIONS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className={`tab-button accent-${tool.accent}`}
                type="button"
                data-active={currentRoute === tool.id}
                aria-current={currentRoute === tool.id ? 'page' : undefined}
                onClick={() => navigateToRoute(tool.id)}
              >
                <Icon size={16} />
                <span className="tab-copy">
                  <span>{tool.label}</span>
                  <small>{tool.description}</small>
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {currentRoute === 'home' ? (
        <main className="workspace home-workspace">{renderWordSetupPanel('home')}</main>
      ) : (
        <main className="workspace material-workspace">
          {renderMaterialSettingsRail()}

          <section
            className={`tool-panel accent-${activeToolConfig.accent}`}
            aria-label={activeToolConfig.label}
          >
            <div className="material-preview-toolbar">
              <h3 className="material-preview-title">{renderPreviewTitle()}</h3>
              {renderMaterialOutputActions()}
            </div>

            {activeTool === 'word-search' && (
              <WordSearchTool
                words={words}
                grade={grade}
                klass={klass}
                imageMap={imageMap}
                size={wordSearchSize}
                uppercase={wordSearchUppercase}
                showAnswer={wordSearchShowAnswer}
                puzzle={wordSearchPuzzle}
              />
            )}

            {activeTool === 'worksheet' && (
              <WorksheetTool
                words={words}
                grade={grade}
                klass={klass}
                imageMap={imageMap}
                worksheet={worksheet}
                columns={worksheetColumns}
                syllables={worksheetShowsLetterSplit}
              />
            )}

            {activeTool === 'flicker' && (
              <FlickerTool
                imageMap={imageMap}
                templates={flickerTemplates}
                sequence={flickerSequence}
              />
            )}

            {activeTool === 'dobble' && (
              <DobbleTool
                words={words}
                imageMap={imageMap}
                details={dobbleDetails}
                displayMode={dobbleDisplayMode}
              />
            )}
          </section>

          {wordDrawerOpen && (
            <button
              className="word-drawer-scrim"
              type="button"
              aria-label="단어 드로어 밖 닫기"
              onClick={() => setWordDrawerOpen(false)}
            />
          )}

          <aside
            className="word-drawer"
            role="complementary"
            aria-label="단어 편집 드로어"
            data-open={wordDrawerOpen}
          >
            {renderWordSetupPanel('drawer')}
          </aside>
        </main>
      )}

      {settingsOpen && (
        <OutputSettingsDialog
          grade={grade}
          klass={klass}
          onGradeChange={setGrade}
          onKlassChange={setKlass}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {dobbleInfoOpen && <DobbleInfoDialog onClose={() => setDobbleInfoOpen(false)} />}

      {imagePicker && (
        <ImagePickerDialog
          key={imagePicker.word}
          state={imagePicker}
          selectedImageUrl={imageMap[imagePicker.word]}
          onSelect={(candidate) => {
            updateImage(imagePicker.word, candidate.imageUrl);
            setImagePicker(null);
            notify(`${imagePicker.word} 사진을 선택했습니다.`);
          }}
          onSearch={(query) => {
            void searchImageCandidates(imagePicker.word, query);
          }}
          onFindMore={(query) => {
            void findMoreImages(imagePicker.word, query);
          }}
          findMoreLoading={imageLoadingWord === imagePicker.word}
          onClose={() => setImagePicker(null)}
        />
      )}

      {toast && <div className="toast">{toast.text}</div>}
    </div>
  );
}

function readWorkspaceDraft(): WorkspaceDraft {
  try {
    const rawDraft = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!rawDraft) {
      return {};
    }

    return parseWorkspaceDraft(JSON.parse(rawDraft) as unknown);
  } catch {
    return {};
  }
}

function parseWorkspaceDraft(value: unknown): WorkspaceDraft {
  if (!isRecord(value)) {
    return {};
  }

  return {
    activeTool: isToolId(value.activeTool) ? value.activeTool : undefined,
    wordInput: typeof value.wordInput === 'string' ? value.wordInput : undefined,
    imageMap: isStringRecord(value.imageMap) ? value.imageMap : undefined,
    quizMap: isStringRecord(value.quizMap) ? value.quizMap : undefined,
    wordCart: isStringArray(value.wordCart) ? value.wordCart : undefined,
    grade: typeof value.grade === 'number' ? Math.max(1, Math.min(6, value.grade)) : undefined,
    klass: typeof value.klass === 'number' ? Math.max(1, value.klass) : undefined,
    imageCandidatesByWord: isImageCandidateMap(value.imageCandidatesByWord)
      ? value.imageCandidatesByWord
      : undefined,
    imageSearchQueryByWord: isStringRecord(value.imageSearchQueryByWord)
      ? value.imageSearchQueryByWord
      : undefined,
  };
}

function writeWorkspaceDraft(draft: WorkspaceDraft) {
  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Uploaded data URLs can exceed storage quota; the live workspace should keep working.
  }
}

function routeFromPath(pathname: string): RouteId {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const routeEntry = Object.entries(ROUTE_PATHS).find(([, path]) => path === normalizedPath);

  if (!routeEntry) {
    return 'home';
  }

  return routeEntry[0] as RouteId;
}

function pickExistingWordEntries<T>(record: Record<string, T>, words: string[]): Record<string, T> {
  return words.reduce<Record<string, T>>((entries, word) => {
    if (Object.hasOwn(record, word)) {
      entries[word] = record[word];
    }
    return entries;
  }, {});
}

function mergeWordLists(currentWords: string[], nextWords: string[]): string[] {
  const mergedWords = new Set(currentWords);
  nextWords.forEach((word) => {
    const trimmedWord = word.trim();
    if (trimmedWord) {
      mergedWords.add(trimmedWord);
    }
  });
  return Array.from(mergedWords);
}

function mergeImageCandidates(
  currentCandidates: ImageCandidate[],
  nextCandidates: ImageCandidate[],
): ImageCandidate[] {
  const seen = new Set<string>();
  return [...currentCandidates, ...nextCandidates].filter((candidate) => {
    const key = candidate.imageUrl || candidate.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isToolId(value: unknown): value is ToolId {
  return (
    value === 'word-search' || value === 'worksheet' || value === 'flicker' || value === 'dobble'
  );
}

function isImageProvider(value: unknown): value is ImageCandidate['provider'] {
  return value === 'auto' || value === 'openverse' || value === 'commons';
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isImageCandidate(value: unknown): value is ImageCandidate {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.imageUrl === 'string' &&
    typeof value.thumbnailUrl === 'string' &&
    typeof value.sourceUrl === 'string' &&
    isImageProvider(value.provider)
  );
}

function isImageCandidateMap(value: unknown): value is ImageCandidateMap {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (candidates) => Array.isArray(candidates) && candidates.every(isImageCandidate),
    )
  );
}

function MaterialPlanPanel({
  tool,
  statusLabel,
  statusTone,
  summary,
}: {
  tool: (typeof TOOL_OPTIONS)[number];
  statusLabel?: string;
  statusTone?: 'success' | 'danger';
  summary: string;
}) {
  const Icon = tool.icon;

  return (
    <section className={`material-plan-panel accent-${tool.accent}`} aria-label="현재 자료">
      <div className="material-plan-title">
        <div className="material-title-row">
          <Icon size={20} />
          <h2>{tool.label}</h2>
          {statusLabel && <span data-tone={statusTone}>{statusLabel}</span>}
        </div>
        <p>{summary}</p>
      </div>
    </section>
  );
}

function WordSearchSettings({
  size,
  difficultyIndex,
  currentDifficulty,
  fillerMode,
  uppercase,
  showAnswer,
  onSizeChange,
  onDifficultyDecrease,
  onDifficultyIncrease,
  onFillerModeChange,
  onUppercaseChange,
  onShowAnswerChange,
}: {
  size: number;
  difficultyIndex: number;
  currentDifficulty: (typeof WORD_SEARCH_DIFFICULTIES)[number];
  fillerMode: FillerMode;
  uppercase: boolean;
  showAnswer: boolean;
  onSizeChange: (value: number) => void;
  onDifficultyDecrease: () => void;
  onDifficultyIncrease: () => void;
  onFillerModeChange: (value: FillerMode) => void;
  onUppercaseChange: (value: boolean) => void;
  onShowAnswerChange: (value: boolean) => void;
}) {
  return (
    <div className="word-search-controls" role="group" aria-label="낱말찾기 설정">
      <CompactStepperControl
        ariaLabel="퍼즐 크기"
        title="퍼즐 크기"
        valueLabel={`${size} x ${size}`}
        minusLabel="퍼즐 크기 줄이기"
        plusLabel="퍼즐 크기 늘리기"
        onMinus={() => onSizeChange(Math.max(WORD_SEARCH_MIN_SIZE, size - 1))}
        onPlus={() => onSizeChange(Math.min(WORD_SEARCH_MAX_SIZE, size + 1))}
        minusDisabled={size <= WORD_SEARCH_MIN_SIZE}
        plusDisabled={size >= WORD_SEARCH_MAX_SIZE}
      />
      <CompactStepperControl
        ariaLabel="난이도"
        title="난이도"
        valueLabel={currentDifficulty.label}
        caption={currentDifficulty.description}
        minusLabel="난이도 낮추기"
        plusLabel="난이도 올리기"
        onMinus={onDifficultyDecrease}
        onPlus={onDifficultyIncrease}
        minusDisabled={difficultyIndex <= 0}
        plusDisabled={difficultyIndex >= WORD_SEARCH_DIFFICULTIES.length - 1}
      />
      <div className="filler-choice-group" role="group" aria-label="채움 방식">
        <div className="control-kicker">채움 방식</div>
        <div className="filler-choice-grid">
          {FILLER_MODE_OPTIONS.map((option) => (
            <button
              className="choice-button"
              type="button"
              key={option.value}
              aria-pressed={fillerMode === option.value}
              data-active={fillerMode === option.value}
              onClick={() => onFillerModeChange(option.value)}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="inline-toggle-stack">
        <Toggle label="대문자" checked={uppercase} onChange={onUppercaseChange} />
        <Toggle label="정답 보기" checked={showAnswer} onChange={onShowAnswerChange} />
      </div>
    </div>
  );
}

function WorksheetSettings({
  columns,
  showLetterSplit,
  letterSplit,
  onColumnsChange,
  onLetterSplitChange,
}: {
  columns: number;
  showLetterSplit: boolean;
  letterSplit: boolean;
  onColumnsChange: (value: number) => void;
  onLetterSplitChange: (value: boolean) => void;
}) {
  return (
    <div className="tool-controls" role="group" aria-label="활동지 설정">
      <NumberField label="한 줄 칸 수" value={columns} min={1} max={8} onChange={onColumnsChange} />
      {showLetterSplit && (
        <Toggle label="글자 나누기" checked={letterSplit} onChange={onLetterSplitChange} />
      )}
    </div>
  );
}

function FlickerSettings({
  templates,
  onTemplateToggle,
}: {
  templates: FlickerTemplate[];
  onTemplateToggle: (template: FlickerTemplate) => void;
}) {
  return (
    <div className="flicker-settings" role="group" aria-label="깜빡이 설정">
      <div className="control-kicker">슬라이드 양식</div>
      <div className="template-picker" role="group" aria-label="슬라이드 양식">
        {FLICKER_TEMPLATES.map((template) => (
          <button
            key={template.id}
            className="choice-button"
            type="button"
            data-active={templates.includes(template.id)}
            onClick={() => onTemplateToggle(template.id)}
          >
            {templates.includes(template.id) && <Check size={14} />}
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function WordSearchTool({
  words,
  grade,
  klass,
  imageMap,
  size,
  uppercase,
  showAnswer,
  puzzle,
}: {
  words: string[];
  grade: number;
  klass: number;
  imageMap: ImageMap;
  size: number;
  uppercase: boolean;
  showAnswer: boolean;
  puzzle: WordSearchPuzzleState;
}) {
  const hasError = puzzle instanceof Error;
  const currentGrid = !hasError && puzzle ? (showAnswer ? puzzle.answerGrid : puzzle.grid) : [];
  const preparedImageCount = getPreparedImageCount(words, imageMap);

  return (
    <>
      {hasError ? (
        <Callout tone="warning">{puzzle.message}</Callout>
      ) : (
        <div className="preview-layout printable">
          <div className="puzzle-sheet">
            <div className="sheet-meta">
              <div className="sheet-title-row">
                <h3>{/[가-힣]/.test(words.join('')) ? '낱말 찾기' : '단어 찾기'}</h3>
              </div>
              <StudentInfo grade={grade} klass={klass} />
            </div>
            <p className="sheet-instruction">{WORD_SEARCH_STUDENT_INSTRUCTION}</p>
            <div className="puzzle-board-wrap">
              <div
                className="puzzle-grid"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(size, 1)}, minmax(0, 1fr))`,
                }}
              >
                {currentGrid.flat().map((cell, index) => (
                  <span className={cell ? '' : 'answer-empty'} key={`${cell}-${index}`}>
                    {cell || '·'}
                  </span>
                ))}
              </div>
            </div>
            <WordImageHints words={words} imageMap={imageMap} uppercase={uppercase} />
          </div>
        </div>
      )}
      <p className="sr-only">
        사진 {preparedImageCount}/{words.length}개 준비
      </p>
    </>
  );
}

function WorksheetTool({
  words,
  grade,
  klass,
  imageMap,
  worksheet,
  columns,
  syllables,
}: {
  words: string[];
  grade: number;
  klass: number;
  imageMap: ImageMap;
  worksheet: ReturnType<typeof buildWorksheetCells>;
  columns: number;
  syllables: boolean;
}) {
  const preparedImageCount = getPreparedImageCount(words, imageMap);

  return (
    <>
      <div className="worksheet-sheet printable">
        <div className="sheet-meta">
          <div className="sheet-title-row">
            <h3>단어 활동지</h3>
          </div>
          <StudentInfo grade={grade} klass={klass} />
        </div>
        <p className="sheet-instruction">{WORKSHEET_STUDENT_INSTRUCTION}</p>
        <div
          className="worksheet-grid"
          style={{ gridTemplateColumns: `repeat(${worksheet.columns}, minmax(96px, 1fr))` }}
        >
          {words.length === 0 ? (
            <EmptyState text="단어를 입력하면 활동지를 미리 볼 수 있습니다." />
          ) : (
            worksheet.rows
              .flat()
              .map((word) => (
                <MaterialTile
                  key={word}
                  word={word}
                  imageUrl={imageMap[word]}
                  syllables={syllables}
                />
              ))
          )}
        </div>
      </div>
      <p className="sr-only">
        사진 {preparedImageCount}/{words.length}개 준비 · 한 줄 {columns}칸
      </p>
    </>
  );
}

function FlickerTool({
  imageMap,
  templates,
  sequence,
}: {
  imageMap: ImageMap;
  templates: FlickerTemplate[];
  sequence: ReturnType<typeof buildFlickerSequence>;
}) {
  return (
    <>
      {templates.length === 0 ? (
        <Callout tone="warning">슬라이드 양식을 하나 이상 선택하세요.</Callout>
      ) : (
        <div className="flicker-strip printable">
          {sequence.length === 0 ? (
            <EmptyState text="단어를 입력하면 깜빡이 슬라이드를 미리 볼 수 있습니다." />
          ) : (
            sequence.map((slide, index) => (
              <div className="slide-preview" key={`${slide.word}-${slide.template}-${index}`}>
                <span className="mono-label">{index + 1}</span>
                {slide.template !== 'blank' && slide.template !== 'image' && (
                  <strong>{slide.word}</strong>
                )}
                {slide.template !== 'blank' && slide.template !== 'word' && (
                  <ImagePreview word={slide.word} imageUrl={imageMap[slide.word]} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}

function getDobblePlanDetails(words: string[], imageMap: ImageMap, displayMode: DobbleDisplayMode) {
  const plan = selectDobblePlan(words.length);
  const indexes = plan.kind === 'unavailable' ? [] : plan.cards;
  const usedWords = Array.from(new Set(indexes.flat().map((wordIndex) => words[wordIndex]))).filter(
    (word): word is string => Boolean(word),
  );
  const usedWordCount = plan.kind === 'unavailable' ? 0 : plan.usedWordCount;
  const unusedWordCount =
    plan.kind === 'unavailable' ? 0 : Math.max(0, words.length - usedWordCount);
  const showDobblePhotoStatus = plan.kind !== 'unavailable' && displayMode !== 'word';
  const preparedDobbleImageCount = usedWords.filter((word) => Boolean(imageMap[word])).length;
  const missingDobbleImageCount = Math.max(0, usedWords.length - preparedDobbleImageCount);
  const showDobbleInitialFallback = showDobblePhotoStatus && missingDobbleImageCount > 0;
  const missingRequiredImageCount = displayMode === 'image' ? missingDobbleImageCount : 0;
  const canExportDobble = plan.kind !== 'unavailable' && missingRequiredImageCount === 0;
  const picturesPerCard =
    plan.kind === 'unavailable' ? plan.suggestedPicturesPerCard : plan.picturesPerCard;
  const wordsUntilComplete =
    plan.kind === 'partial' ? Math.max(0, plan.requiredWords - words.length) : 0;
  const disabledReason =
    plan.kind === 'unavailable'
      ? `단어 ${plan.wordsNeeded}개를 더 넣어주세요.`
      : missingRequiredImageCount > 0
        ? `사진만 카드에는 사진이 모두 필요합니다. 사진 ${missingRequiredImageCount}개를 더 준비해주세요.`
        : undefined;
  const dobblePlanTitle =
    plan.kind === 'unavailable' ? `단어 ${plan.wordsNeeded}개 더 필요` : '바로 출력 가능';
  const dobblePlanSummary =
    plan.kind === 'unavailable'
      ? `현재 ${words.length}개 · 최소 ${plan.minimumSafeWords}개`
      : `카드 ${indexes.length}장 · 카드당 단어 ${picturesPerCard}개`;
  const dobbleCompletionHint =
    plan.kind === 'partial' && wordsUntilComplete > 0
      ? `단어 ${wordsUntilComplete}개 더 넣으면 카드 ${plan.requiredWords}장 가능`
      : undefined;
  const dobblePhotoIssue =
    missingRequiredImageCount > 0
      ? `사진만 카드에는 사진 ${missingRequiredImageCount}개가 더 필요합니다`
      : showDobbleInitialFallback
        ? `사진 ${missingDobbleImageCount}개 필요 · 부족한 사진은 첫 글자로 대체됨`
        : undefined;
  const dobbleExcludedIssue =
    unusedWordCount > 0 ? `단어 ${unusedWordCount}개는 카드에 안 들어감` : undefined;

  return {
    plan,
    indexes,
    canExportDobble,
    picturesPerCard,
    disabledReason,
    dobblePlanTitle,
    dobblePlanSummary,
    dobbleCompletionHint,
    dobblePhotoIssue,
    dobbleExcludedIssue,
  };
}

function DobblePlanPanel({
  tool,
  details,
  onInfoOpen,
}: {
  tool: (typeof TOOL_OPTIONS)[number];
  details: ReturnType<typeof getDobblePlanDetails>;
  onInfoOpen: () => void;
}) {
  const Icon = tool.icon;

  return (
    <section
      className="dobble-plan-panel"
      data-kind={details.plan.kind}
      aria-label="도블 생성 방식"
    >
      <div className="dobble-plan-hero">
        <div className="dobble-plan-title">
          <div className="dobble-title-row">
            <Icon size={20} />
            <h2>{tool.label}</h2>
            <span data-tone={details.plan.kind === 'unavailable' ? 'danger' : 'success'}>
              {details.dobblePlanTitle}
            </span>
            <button
              className="icon-button dobble-info-button"
              type="button"
              aria-label="도블 설명 보기"
              title="도블 설명 보기"
              onClick={onInfoOpen}
            >
              <HelpCircle size={16} />
            </button>
          </div>
          <p>{details.dobblePlanSummary}</p>
        </div>
      </div>

      {(details.dobbleCompletionHint ||
        details.dobblePhotoIssue ||
        details.dobbleExcludedIssue) && (
        <div className="dobble-plan-alerts" role="status" aria-live="polite">
          {details.dobbleCompletionHint && (
            <span data-tone="opportunity">{details.dobbleCompletionHint}</span>
          )}
          {details.dobblePhotoIssue && <span data-tone="caution">{details.dobblePhotoIssue}</span>}
          {details.dobbleExcludedIssue && (
            <span data-tone="caution">{details.dobbleExcludedIssue}</span>
          )}
        </div>
      )}
    </section>
  );
}

function DobbleDisplayControls({
  canExportDobble,
  displayMode,
  onDisplayModeChange,
}: {
  canExportDobble: boolean;
  displayMode: DobbleDisplayMode;
  onDisplayModeChange: (mode: DobbleDisplayMode) => void;
}) {
  if (!canExportDobble) {
    return null;
  }

  return (
    <div className="dobble-display-controls" role="group" aria-label="도블 표시 방식">
      <div className="control-kicker">카드에 넣을 내용</div>
      <div className="dobble-display-grid">
        {DOBBLE_DISPLAY_OPTIONS.map((option) => (
          <button
            className="option-card-button"
            type="button"
            key={option.value}
            aria-pressed={displayMode === option.value}
            onClick={() => onDisplayModeChange(option.value)}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DobbleTool({
  words,
  imageMap,
  details,
  displayMode,
}: {
  words: string[];
  imageMap: ImageMap;
  details: ReturnType<typeof getDobblePlanDetails>;
  displayMode: DobbleDisplayMode;
}) {
  return details.indexes.length > 0 ? (
    <>
      <div className="dobble-grid printable">
        {details.indexes.map((card, index) => (
          <div className="dobble-card" key={index}>
            <span className="mono-label">카드 {index + 1}</span>
            <div
              className="dobble-card-preview"
              role="group"
              aria-label={`도블 카드 ${index + 1}`}
              data-display-mode={displayMode}
            >
              {card.map((symbolIndex, symbolPosition) => {
                const word = words[symbolIndex];
                const showImage = displayMode !== 'word';
                const showLabel = displayMode !== 'image';
                return (
                  <div
                    className="dobble-symbol"
                    key={symbolIndex}
                    aria-label={word}
                    data-display-mode={displayMode}
                    style={dobbleSymbolStyle(symbolPosition, card.length, index)}
                  >
                    {showImage ? (
                      <span className="dobble-symbol-image">
                        {imageMap[word] ? (
                          <img src={imageMap[word]} alt={showLabel ? '' : word} />
                        ) : (
                          <span aria-hidden="true">{dobbleInitial(word)}</span>
                        )}
                        {showLabel && <span className="dobble-symbol-label">{word}</span>}
                      </span>
                    ) : (
                      <span className="dobble-word-symbol">{word}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  ) : (
    <EmptyState text="단어를 더 넣으면 안전한 도블 카드 미리보기가 여기에 나타납니다." />
  );
}

function dobbleSymbolStyle(
  symbolIndex: number,
  symbolCount: number,
  cardIndex: number,
): CSSProperties {
  const { rotation, size, x, y } = dobbleSymbolLayout(symbolIndex, symbolCount, cardIndex);

  return {
    '--symbol-size': `${size}%`,
    '--symbol-x': `${x}%`,
    '--symbol-y': `${y}%`,
    '--symbol-rotate': `${rotation}deg`,
    '--symbol-scale': '1',
  } as CSSProperties;
}

function dobbleSymbolLayout(
  symbolIndex: number,
  symbolCount: number,
  cardIndex: number,
): { rotation: number; size: number; x: number; y: number } {
  const fixedLayouts: Partial<Record<number, Array<[number, number]>>> = {
    3: [
      [50, 26],
      [73, 67],
      [27, 67],
    ],
    4: [
      [29, 29],
      [71, 29],
      [71, 71],
      [29, 71],
    ],
    5: [
      [50, 50],
      [27, 27],
      [73, 27],
      [73, 73],
      [27, 73],
    ],
  };
  const fixedLayout = fixedLayouts[symbolCount];

  if (fixedLayout) {
    const layouts = withDobbleRotations(
      spreadDobbleSymbols(
        fixedLayout.map(([x, y]) => ({
          rotation: 0,
          size: dobbleSymbolSize(symbolCount),
          x,
          y,
        })),
      ),
      cardIndex,
    );

    return layouts[symbolIndex];
  }

  const symbolSize = dobbleSymbolSize(symbolCount);
  const initialLayouts = Array.from({ length: symbolCount }, (_, index) => {
    const angle = -90 + (index * 360) / symbolCount + (cardIndex % 2 === 0 ? -4 : 4);
    const radius = dobbleSymbolRadius(symbolCount);
    const radians = (angle * Math.PI) / 180;

    return {
      rotation: 0,
      size: symbolSize,
      x: 50 + Math.cos(radians) * radius,
      y: 50 + Math.sin(radians) * radius,
    };
  });

  return withDobbleRotations(spreadDobbleSymbols(initialLayouts), cardIndex)[symbolIndex];
}

function withDobbleRotations(
  layouts: Array<{ rotation: number; size: number; x: number; y: number }>,
  cardIndex: number,
): Array<{ rotation: number; size: number; x: number; y: number }> {
  return layouts.map((layout, index) => ({
    ...layout,
    rotation: dobbleSymbolRotation(layout.x, layout.y, index, cardIndex),
  }));
}

function spreadDobbleSymbols(
  layouts: Array<{ rotation: number; size: number; x: number; y: number }>,
): Array<{ rotation: number; size: number; x: number; y: number }> {
  const padding = 5;
  const collisionGap = 2;
  const nextLayouts = layouts.map((layout) => ({ ...layout }));

  for (let iteration = 0; iteration < 8; iteration += 1) {
    for (let leftIndex = 0; leftIndex < nextLayouts.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < nextLayouts.length; rightIndex += 1) {
        const left = nextLayouts[leftIndex];
        const right = nextLayouts[rightIndex];
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.hypot(dx, dy) || 1;
        const minimumDistance = (left.size + right.size) / 2 + collisionGap;

        if (distance >= minimumDistance) {
          continue;
        }

        const push = (minimumDistance - distance) / 2;
        const pushX = (dx / distance) * push;
        const pushY = (dy / distance) * push;

        left.x -= pushX;
        left.y -= pushY;
        right.x += pushX;
        right.y += pushY;
      }
    }

    nextLayouts.forEach((layout) => {
      const radius = layout.size / 2;
      layout.x = clampNumber(layout.x, radius + padding, 100 - radius - padding);
      layout.y = clampNumber(layout.y, radius + padding, 100 - radius - padding);
    });
  }

  return nextLayouts;
}

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function dobbleSymbolRotation(
  x: number,
  y: number,
  symbolIndex: number,
  cardIndex: number,
): number {
  const dx = x - 50;
  const dy = y - 50;
  const jitter = dobbleRotationJitter(symbolIndex, cardIndex);

  if (Math.hypot(dx, dy) < 1) {
    return normalizeDegrees(jitter);
  }

  return normalizeDegrees((Math.atan2(dy, dx) * 180) / Math.PI - 90 + jitter);
}

function dobbleRotationJitter(symbolIndex: number, cardIndex: number): number {
  const jitters = [-7, 6, -4, 8, -6, 5, 3];

  return jitters[(cardIndex * 3 + symbolIndex * 2) % jitters.length];
}

function normalizeDegrees(value: number): number {
  return Math.round(((value % 360) + 360) % 360);
}

function dobbleSymbolSize(symbolCount: number): number {
  if (symbolCount === 3) {
    return 40;
  }

  if (symbolCount <= 4) {
    return 38;
  }

  if (symbolCount === 5) {
    return 28;
  }

  if (symbolCount === 6) {
    return 23;
  }

  return 19;
}

function dobbleSymbolRadius(symbolCount: number): number {
  if (symbolCount <= 4) {
    return 25;
  }

  if (symbolCount === 5) {
    return 32;
  }

  if (symbolCount === 6) {
    return 34;
  }

  return 36;
}

function dobbleInitial(word: string): string {
  return word.trim().charAt(0).toUpperCase();
}

function getPreparedImageCount(words: string[], imageMap: ImageMap): number {
  return words.filter((word) => Boolean(imageMap[word])).length;
}

function WordImageHints({
  words,
  imageMap,
  uppercase,
}: {
  words: string[];
  imageMap: ImageMap;
  uppercase: boolean;
}) {
  return (
    <section className="hint-section" aria-label="찾을 낱말">
      <div className="hint-heading">
        <strong>찾을 낱말</strong>
        <span>사진 힌트</span>
      </div>
      <div className="hint-grid">
        {words.map((word) => (
          <div className="hint-item" key={word}>
            <span className="hint-checkmark" aria-hidden="true" />
            <ImagePreview word={word} imageUrl={imageMap[word]} />
            <span>{uppercase ? word.toUpperCase() : word}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImagePreview({ word, imageUrl }: { word: string; imageUrl?: string }) {
  if (imageUrl) {
    return <img className="image-preview" src={imageUrl} alt={word} />;
  }

  return (
    <div className="image-placeholder" aria-label={`${word} 사진 자리`}>
      <BookOpen size={18} />
    </div>
  );
}

function MaterialTile({
  word,
  imageUrl,
  syllables,
}: {
  word: string;
  imageUrl?: string;
  syllables: boolean;
}) {
  return (
    <div className="material-tile" role="group" aria-label={`${word} 단어 카드`}>
      <ImagePreview word={word} imageUrl={imageUrl} />
      <strong>{syllables ? word.split('').join(' · ') : word}</strong>
      <div className="write-practice" aria-label={`${word} 쓰기 연습`}>
        <span>써 보기</span>
        <span className="write-line" />
        <span className="write-line" />
      </div>
    </div>
  );
}

function OutputSettingsDialog({
  grade,
  klass,
  onGradeChange,
  onKlassChange,
  onClose,
}: {
  grade: number;
  klass: number;
  onGradeChange: (value: number) => void;
  onKlassChange: (value: number) => void;
  onClose: () => void;
}) {
  const [draftGrade, setDraftGrade] = useState(String(grade));
  const [draftKlass, setDraftKlass] = useState(String(klass));

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function saveAndClose() {
    onGradeChange(clampNumberInput(draftGrade, 1, 6));
    onKlassChange(clampNumberInput(draftKlass, 1, 99));
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="학급 정보"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <p className="mono-label">설정</p>
            <h2>학급 정보</h2>
          </div>
          <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-form">
          <label>
            <span>학년</span>
            <input
              type="number"
              min={1}
              max={6}
              value={draftGrade}
              onChange={(event) => setDraftGrade(event.currentTarget.value)}
            />
          </label>
          <label>
            <span>반</span>
            <input
              type="number"
              min={1}
              value={draftKlass}
              onChange={(event) => setDraftKlass(event.currentTarget.value)}
            />
          </label>
        </div>

        <div className="dialog-actions">
          <button className="primary-button" type="button" onClick={saveAndClose}>
            완료
          </button>
        </div>
      </section>
    </div>
  );
}

function DobbleInfoDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="dobble-info-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="도블 카드 설명"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <p className="mono-label">도블 카드</p>
            <h2>도블 카드 설명</h2>
          </div>
          <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dobble-info-body">
          <p>카드 두 장에서 똑같이 들어 있는 그림 하나를 찾는 게임입니다.</p>
          <ul>
            <li>카드 수와 카드당 단어 수는 단어 수에 맞춰 자동으로 정합니다.</li>
            <li>사진이 부족하면 그 단어는 첫 글자로 표시됩니다.</li>
            <li>사진만으로 놀이하려면 단어 준비 화면의 사진과 카드 미리보기를 확인하면 됩니다.</li>
            <li>단어가 부족하면 출력 버튼이 꺼지고, 몇 개를 더 넣어야 하는지 표시됩니다.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function clampNumberInput(value: string, min: number, max: number): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(min, Math.min(max, number));
}

function ImagePickerDialog({
  state,
  selectedImageUrl,
  onSelect,
  onSearch,
  onFindMore,
  findMoreLoading,
  onClose,
}: {
  state: ImagePickerState;
  selectedImageUrl?: string;
  onSelect: (candidate: ImageCandidate) => void;
  onSearch: (query: string) => void;
  onFindMore: (query: string) => void;
  findMoreLoading: boolean;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState(state.searchedQuery);
  const trimmedSearchQuery = searchQuery.trim();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedSearchQuery || findMoreLoading) {
      return;
    }

    onSearch(trimmedSearchQuery);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="image-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${state.word} 사진 선택`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="image-picker-heading">
          <div>
            <p className="mono-label">사진 검색 결과</p>
            <h2>{state.word} 사진 선택</h2>
            <p className="image-picker-summary">사진 {state.candidates.length}장 중 선택</p>
          </div>
          <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="image-picker-search" onSubmit={submitSearch}>
          <label htmlFor={`image-search-query-${state.word}`}>
            <span>검색어 바꾸기</span>
            <input
              id={`image-search-query-${state.word}`}
              aria-label="사진 검색어"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="turtle, sea turtle"
            />
          </label>
          <p>한글 결과가 아쉬우면 영어 이름이나 더 구체적인 표현으로 다시 찾아보세요.</p>
          <button
            className="primary-button"
            type="submit"
            disabled={!trimmedSearchQuery || findMoreLoading}
          >
            {findMoreLoading ? <ButtonSpinner /> : <Search size={15} />}
            {findMoreLoading ? '새 검색 중' : '새 검색으로 바꾸기'}
          </button>
        </form>

        <div className="image-result-grid">
          {state.candidates.map((candidate, index) => {
            const isSelected = candidate.imageUrl === selectedImageUrl;
            return (
              <article
                className="image-result-card"
                data-recommended={!isSelected && index === 0 ? 'true' : undefined}
                data-selected={isSelected ? 'true' : undefined}
                key={candidate.id}
              >
                {isSelected ? (
                  <span className="result-badge">현재 선택</span>
                ) : (
                  index === 0 && <span className="result-badge">추천</span>
                )}
                <div className="image-result-media">
                  <img src={candidate.thumbnailUrl} alt={candidate.title} />
                </div>
                <div className="image-result-meta">
                  <strong>{candidate.title}</strong>
                  <span>
                    {candidate.provider === 'openverse' ? 'Openverse' : 'Wikimedia Commons'}
                    {candidate.license ? ` · ${candidate.license}` : ''}
                  </span>
                </div>
                <a
                  className="image-result-source"
                  href={candidate.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  출처 보기
                  <ExternalLink size={13} />
                </a>
                <button
                  className="primary-button image-result-action"
                  type="button"
                  onClick={() => onSelect(candidate)}
                  disabled={isSelected}
                >
                  {isSelected ? '사용 중' : '이 사진 사용'}
                </button>
              </article>
            );
          })}
        </div>
        <div className="image-picker-footer">
          <button
            className="secondary-button image-picker-more"
            type="button"
            onClick={() => onFindMore(trimmedSearchQuery || state.word)}
            disabled={findMoreLoading || !trimmedSearchQuery}
          >
            {findMoreLoading ? <ButtonSpinner /> : <Search size={15} />}
            {findMoreLoading ? '결과 불러오는 중' : '결과 더 보기'}
          </button>
        </div>
      </section>
    </div>
  );
}

function StudentInfo({ grade, klass }: { grade: number; klass: number }) {
  return (
    <p className="student-info" aria-label="학생 정보">
      {grade}학년 {klass}반
    </p>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function CompactStepperControl({
  ariaLabel,
  title,
  valueLabel,
  caption,
  minusLabel,
  plusLabel,
  onMinus,
  onPlus,
  minusDisabled,
  plusDisabled,
}: {
  ariaLabel: string;
  title: string;
  valueLabel: string;
  caption?: string;
  minusLabel: string;
  plusLabel: string;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled: boolean;
  plusDisabled: boolean;
}) {
  return (
    <div className="compact-stepper-control" role="group" aria-label={ariaLabel}>
      <div>
        <span className="control-kicker">{title}</span>
        <strong>{valueLabel}</strong>
        {caption && <small>{caption}</small>}
      </div>
      <div className="stepper-buttons">
        <button
          className="stepper-button"
          type="button"
          aria-label={plusLabel}
          onClick={onPlus}
          disabled={plusDisabled}
        >
          <Plus size={16} />
        </button>
        <button
          className="stepper-button"
          type="button"
          aria-label={minusLabel}
          onClick={onMinus}
          disabled={minusDisabled}
        >
          <Minus size={16} />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="toggle-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'neutral' | 'warning' | 'success';
}) {
  return (
    <span className="badge" data-tone={tone}>
      {children}
    </span>
  );
}

function Callout({ children, tone }: { children: React.ReactNode; tone: 'warning' | 'success' }) {
  return (
    <div className="callout" data-tone={tone}>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function ButtonSpinner() {
  return <span className="button-spinner" aria-hidden="true" />;
}

function ActionBar({
  onPrint,
  onExport,
  exportLabel,
  exportDisabled = false,
  disabledReason,
  summary,
  variant = 'sticky',
  showDisabledReason = true,
}: {
  onPrint: () => void;
  onExport: () => Promise<void>;
  exportLabel: string;
  exportDisabled?: boolean;
  disabledReason?: string;
  summary?: string;
  variant?: 'sticky' | 'inline';
  showDisabledReason?: boolean;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const isDisabled = exportDisabled || isExporting;
  const disabledTitle = exportDisabled ? disabledReason : undefined;
  const isCompact = variant === 'inline';

  async function handleExport() {
    if (isDisabled) {
      return;
    }

    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  }

  const printButton = (
    <button
      className={isCompact ? 'primary-button' : 'secondary-button'}
      type="button"
      aria-label="미리보기 인쇄"
      onClick={onPrint}
      disabled={isDisabled}
      title={disabledTitle ?? '미리보기 인쇄'}
    >
      <Printer size={15} />
      {!isCompact && '미리보기 인쇄'}
    </button>
  );
  const exportButton = (
    <button
      className={isCompact ? 'secondary-button' : 'primary-button'}
      type="button"
      aria-label={isExporting ? '파일 생성 중' : exportLabel}
      onClick={() => {
        void handleExport();
      }}
      disabled={isDisabled}
      title={disabledTitle ?? exportLabel}
    >
      {isExporting ? <ButtonSpinner /> : <Download size={15} />}
      {!isCompact && (isExporting ? '파일 생성 중' : exportLabel)}
    </button>
  );

  return (
    <div className="action-bar" data-variant={variant} role="group" aria-label="출력 작업">
      {summary && <p className="action-summary">{summary}</p>}
      {showDisabledReason && disabledReason && exportDisabled && (
        <p className="action-disabled-reason" aria-live="polite">
          {disabledReason}
        </p>
      )}
      <div className="action-buttons">
        {isCompact ? (
          <>
            {exportButton}
            {printButton}
          </>
        ) : (
          <>
            {printButton}
            {exportButton}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
