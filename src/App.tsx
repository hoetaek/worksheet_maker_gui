import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Grid3X3,
  Images,
  Layers3,
  Menu,
  Minus,
  Plus,
  Printer,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  buildDobbleCards,
  nearestValidPicturesPerCard,
  requiredDobbleWordCount,
  validPicturesPerCard,
} from './lib/dobble';
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

type ImageMap = Record<string, string>;
type ImageCandidateMap = Record<string, ImageCandidate[]>;
type ImageSearchQueryMap = Record<string, string>;

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

const SAMPLE_WORDS = '토끼, 거북이, 사자, banana, peach, police_officer';
const FLICKER_TEMPLATES: Array<{ id: FlickerTemplate; label: string }> = [
  { id: 'word', label: '단어' },
  { id: 'image', label: '사진' },
  { id: 'word-image', label: '단어+사진' },
  { id: 'blank', label: '빈 슬라이드' },
];

const LANGUAGE_LABELS = {
  english: '영어',
  korean: '한글',
  mixed: '혼합',
} as const;

const IMAGE_SEARCH_LIMIT = 8;
const IMAGE_EXPANDED_SEARCH_LIMIT = 12;
const WORKSPACE_STORAGE_KEY = 'worksheet-maker-workspace-v1';
const WORD_SEARCH_MIN_SIZE = 5;
const WORD_SEARCH_MAX_SIZE = 28;

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

function App() {
  const [workspaceDraft] = useState(readWorkspaceDraft);
  const [activeTool, setActiveTool] = useState<ToolId>(workspaceDraft.activeTool ?? 'word-search');
  const [wordInput, setWordInput] = useState(workspaceDraft.wordInput ?? SAMPLE_WORDS);
  const [imageMap, setImageMap] = useState<ImageMap>(workspaceDraft.imageMap ?? {});
  const [grade, setGrade] = useState(workspaceDraft.grade ?? 3);
  const [klass, setKlass] = useState(workspaceDraft.klass ?? 1);
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
  const language = detectLanguage(words);
  const activeToolConfig = TOOL_OPTIONS.find((tool) => tool.id === activeTool) ?? TOOL_OPTIONS[0];

  useEffect(() => {
    writeWorkspaceDraft({
      activeTool,
      wordInput,
      imageMap: pickExistingWordEntries(imageMap, words),
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
    wordInput,
    words,
  ]);

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

  function runDownload(action: () => Promise<void>) {
    action()
      .then(() => notify('파일 다운로드를 시작했습니다.'))
      .catch((error: unknown) => {
        notify(error instanceof Error ? error.message : '파일을 만들 수 없습니다.');
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="mark" aria-hidden="true">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="mono-label">학습 자료 제작기</p>
            <h1>학습 자료 제작 스튜디오</h1>
          </div>
        </div>

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
                data-active={activeTool === tool.id}
                aria-current={activeTool === tool.id ? 'page' : undefined}
                onClick={() => {
                  setActiveTool(tool.id);
                  setMobileNavOpen(false);
                }}
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

      <main className="workspace">
        <section className="control-panel" aria-label="입력 설정">
          <div className="panel-heading">
            <div>
              <p className="mono-label">입력</p>
              <h2>단어와 사진</h2>
            </div>
            <Badge tone={wordCountStatus(words.length).tone}>
              {wordCountStatus(words.length).label}
            </Badge>
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
              className="primary-button word-photo-search-action"
              type="button"
              onClick={() => {
                void findAllImages();
              }}
              disabled={words.length === 0 || allImagesLoading}
            >
              <Images size={16} />
              {allImagesLoading ? '사진 전체 검색 중' : '사진 전체 찾기'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setWordInput(SAMPLE_WORDS)}
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

          <div className="settings-grid student-settings">
            <label>
              <span>학년</span>
              <input
                type="number"
                min={1}
                max={6}
                value={grade}
                onChange={(event) => setGrade(Number(event.target.value))}
              />
            </label>
            <label>
              <span>반</span>
              <input
                type="number"
                min={1}
                value={klass}
                onChange={(event) => setKlass(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="keyword-table photo-list" aria-label="단어별 사진">
            {keywordRows.length === 0 ? (
              <EmptyState text="단어를 입력하면 사진 행이 만들어집니다." />
            ) : (
              keywordRows.map((row) => (
                <div className="keyword-row" key={row.word}>
                  <ImagePreview word={row.word} imageUrl={imageMap[row.word]} />
                  <div className="word-photo-copy">
                    <span className="word-token">{row.word}</span>
                    <span>{imageMap[row.word] ? '사진 준비됨' : '사진 없음'}</span>
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

        <section
          className={`tool-panel accent-${activeToolConfig.accent}`}
          aria-label={activeToolConfig.label}
        >
          <ToolHeader tool={activeToolConfig} words={words} language={language} />

          {activeTool === 'word-search' && (
            <WordSearchTool
              words={words}
              grade={grade}
              klass={klass}
              imageMap={imageMap}
              runDownload={runDownload}
            />
          )}

          {activeTool === 'worksheet' && (
            <WorksheetTool
              words={words}
              grade={grade}
              klass={klass}
              imageMap={imageMap}
              runDownload={runDownload}
            />
          )}

          {activeTool === 'flicker' && (
            <FlickerTool words={words} imageMap={imageMap} runDownload={runDownload} />
          )}

          {activeTool === 'dobble' && (
            <DobbleTool words={words} imageMap={imageMap} runDownload={runDownload} />
          )}
        </section>
      </main>

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

function pickExistingWordEntries<T>(record: Record<string, T>, words: string[]): Record<string, T> {
  return words.reduce<Record<string, T>>((entries, word) => {
    if (Object.hasOwn(record, word)) {
      entries[word] = record[word];
    }
    return entries;
  }, {});
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

function ToolHeader({
  tool,
  words,
  language,
}: {
  tool: (typeof TOOL_OPTIONS)[number];
  words: string[];
  language: keyof typeof LANGUAGE_LABELS;
}) {
  const Icon = tool.icon;

  return (
    <div className="tool-heading">
      <div className="tool-title">
        <Icon size={20} />
        <div>
          <p className="mono-label">{LANGUAGE_LABELS[language]}</p>
          <h2>{tool.label}</h2>
          <p className="tool-subtitle">{tool.description}</p>
        </div>
      </div>
      <Badge tone={words.length > 0 ? 'success' : 'neutral'}>단어 {words.length}개</Badge>
    </div>
  );
}

function WordSearchTool({
  words,
  grade,
  klass,
  imageMap,
  runDownload,
}: {
  words: string[];
  grade: number;
  klass: number;
  imageMap: ImageMap;
  runDownload: (action: () => Promise<void>) => void;
}) {
  const [size, setSize] = useState(15);
  const [difficulty, setDifficulty] = useState<WordSearchDifficulty>(1);
  const [fillerMode, setFillerMode] = useState<FillerMode>('balanced');
  const [uppercase, setUppercase] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const difficultyIndex = WORD_SEARCH_DIFFICULTIES.findIndex((item) => item.value === difficulty);
  const currentDifficulty =
    WORD_SEARCH_DIFFICULTIES[difficultyIndex] ?? WORD_SEARCH_DIFFICULTIES[0];

  const puzzle = useMemo(() => {
    if (words.length === 0) {
      return null;
    }

    try {
      return createWordSearch({
        words,
        width: size,
        height: size,
        difficulty,
        fillerMode,
        uppercase,
        seed: 20260502,
      });
    } catch (error) {
      return error instanceof Error ? error : new Error('퍼즐을 만들 수 없습니다.');
    }
  }, [difficulty, fillerMode, size, uppercase, words]);

  const hasError = puzzle instanceof Error;
  const generatedPuzzle = !hasError && puzzle ? puzzle : null;
  const currentGrid = !hasError && puzzle ? (showAnswer ? puzzle.answerGrid : puzzle.grid) : [];
  const decreaseDifficulty = () =>
    setDifficulty(WORD_SEARCH_DIFFICULTIES[Math.max(difficultyIndex - 1, 0)].value);
  const increaseDifficulty = () =>
    setDifficulty(
      WORD_SEARCH_DIFFICULTIES[Math.min(difficultyIndex + 1, WORD_SEARCH_DIFFICULTIES.length - 1)]
        .value,
    );

  return (
    <>
      <div className="word-search-controls" aria-label="낱말찾기 설정">
        <StepperControl
          ariaLabel="퍼즐 크기"
          title="퍼즐 크기"
          valueLabel={`${size} x ${size}`}
          description="정사각형으로 인쇄해 칸이 찌그러지지 않게 유지합니다."
          minusLabel="퍼즐 크기 줄이기"
          plusLabel="퍼즐 크기 늘리기"
          onMinus={() => setSize((current) => Math.max(WORD_SEARCH_MIN_SIZE, current - 1))}
          onPlus={() => setSize((current) => Math.min(WORD_SEARCH_MAX_SIZE, current + 1))}
          minusDisabled={size <= WORD_SEARCH_MIN_SIZE}
          plusDisabled={size >= WORD_SEARCH_MAX_SIZE}
        />
        <StepperControl
          ariaLabel="난이도"
          title="난이도"
          valueLabel={currentDifficulty.label}
          description={currentDifficulty.description}
          minusLabel="난이도 낮추기"
          plusLabel="난이도 올리기"
          onMinus={decreaseDifficulty}
          onPlus={increaseDifficulty}
          minusDisabled={difficultyIndex <= 0}
          plusDisabled={difficultyIndex >= WORD_SEARCH_DIFFICULTIES.length - 1}
        />
        <div className="filler-choice-group" role="group" aria-label="채움 방식">
          <div className="control-kicker">채움 방식</div>
          <div className="filler-choice-grid">
            {FILLER_MODE_OPTIONS.map((option) => (
              <button
                className="option-card-button"
                type="button"
                key={option.value}
                aria-pressed={fillerMode === option.value}
                onClick={() => setFillerMode(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="inline-toggle-stack">
          <Toggle label="대문자" checked={uppercase} onChange={setUppercase} />
          <Toggle label="정답 보기" checked={showAnswer} onChange={setShowAnswer} />
        </div>
      </div>

      {hasError ? (
        <Callout tone="warning">{puzzle.message}</Callout>
      ) : (
        <div className="preview-layout printable">
          <div className="puzzle-sheet">
            <div className="sheet-meta">
              <div>
                <p className="mono-label">출력 미리보기</p>
                <h3>{/[가-힣]/.test(words.join('')) ? '낱말 찾기' : '단어 찾기'}</h3>
              </div>
              <div className="sheet-stats">
                <span>
                  {size} x {size}
                </span>
                <span>단어 {words.length}개</span>
              </div>
            </div>
            <div className="puzzle-board-wrap">
              <StudentInfo grade={grade} klass={klass} />
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

      <ActionBar
        onPrint={() => window.print()}
        onExport={() =>
          runDownload(() =>
            downloadWordSearchDocx({
              words,
              imageMap,
              puzzle: generatedPuzzle,
              grade,
              classNumber: klass,
            }),
          )
        }
        exportLabel="DOCX 다운로드"
      />
    </>
  );
}

function WorksheetTool({
  words,
  grade,
  klass,
  imageMap,
  runDownload,
}: {
  words: string[];
  grade: number;
  klass: number;
  imageMap: ImageMap;
  runDownload: (action: () => Promise<void>) => void;
}) {
  const [columns, setColumns] = useState(5);
  const [syllables, setSyllables] = useState(false);
  const worksheet = useMemo(() => buildWorksheetCells(words, columns), [columns, words]);

  return (
    <>
      <div className="tool-controls">
        <NumberField label="한 줄 칸 수" value={columns} min={1} max={8} onChange={setColumns} />
        <Toggle label="음절 표시" checked={syllables} onChange={setSyllables} />
      </div>

      <div className="worksheet-sheet printable">
        <div className="sheet-meta">
          <h3>단어 활동지</h3>
          <StudentInfo grade={grade} klass={klass} />
        </div>
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

      <ActionBar
        onPrint={() => window.print()}
        onExport={() =>
          runDownload(() =>
            downloadWorksheetDocx({
              words,
              imageMap,
              columns,
              syllables,
              grade,
              classNumber: klass,
            }),
          )
        }
        exportLabel="DOCX 다운로드"
      />
    </>
  );
}

function FlickerTool({
  words,
  imageMap,
  runDownload,
}: {
  words: string[];
  imageMap: ImageMap;
  runDownload: (action: () => Promise<void>) => void;
}) {
  const [templates, setTemplates] = useState<FlickerTemplate[]>(['word', 'image', 'word-image']);
  const sequence = useMemo(() => buildFlickerSequence(templates, words), [templates, words]);

  function toggleTemplate(template: FlickerTemplate) {
    setTemplates((current) => {
      if (current.includes(template)) {
        return current.filter((item) => item !== template);
      }

      return [...current, template];
    });
  }

  return (
    <>
      <div className="template-picker" role="group" aria-label="슬라이드 양식">
        {FLICKER_TEMPLATES.map((template) => (
          <button
            key={template.id}
            className="choice-button"
            type="button"
            data-active={templates.includes(template.id)}
            onClick={() => toggleTemplate(template.id)}
          >
            {templates.includes(template.id) && <Check size={14} />}
            {template.label}
          </button>
        ))}
      </div>

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

      <ActionBar
        onPrint={() => window.print()}
        onExport={() => runDownload(() => downloadFlickerPptx(words, imageMap, templates))}
        exportLabel="PPTX 다운로드"
      />
    </>
  );
}

function DobbleTool({
  words,
  imageMap,
  runDownload,
}: {
  words: string[];
  imageMap: ImageMap;
  runDownload: (action: () => Promise<void>) => void;
}) {
  const [picturesPerCard, setPicturesPerCard] = useState(6);
  const safePicturesPerCard = nearestValidPicturesPerCard(picturesPerCard);
  const requiredWords = requiredDobbleWordCount(safePicturesPerCard);
  const status = wordCountStatus(words.length, requiredWords);
  const indexes = useMemo(() => buildDobbleCards(safePicturesPerCard), [safePicturesPerCard]);
  const symbols = useMemo(
    () => Array.from({ length: requiredWords }, (_, index) => words[index] ?? `word ${index + 1}`),
    [requiredWords, words],
  );

  return (
    <>
      <div className="tool-controls">
        <label>
          <span>카드당 그림 수</span>
          <select
            value={safePicturesPerCard}
            onChange={(event) => setPicturesPerCard(Number(event.target.value))}
          >
            {validPicturesPerCard().map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {words.length !== requiredWords && (
        <Callout tone="warning">
          그림 {safePicturesPerCard}개짜리 도블 카드는 단어 {requiredWords}개가 정확히 필요합니다.
        </Callout>
      )}

      <div className="dobble-grid printable">
        {indexes.map((card, index) => (
          <div className="dobble-card" key={index}>
            <span className="mono-label">카드 {index + 1}</span>
            <div className="dobble-symbols">
              {card.map((symbolIndex) => {
                const word = symbols[symbolIndex];
                return (
                  <span key={symbolIndex}>
                    {imageMap[word] ? <img src={imageMap[word]} alt="" /> : null}
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ActionBar
        onPrint={() => window.print()}
        onExport={() =>
          runDownload(() =>
            downloadDobblePptx(
              indexes.map((card) =>
                card.map((index) => ({
                  word: symbols[index],
                  image: imageMap[symbols[index]] || undefined,
                })),
              ),
              safePicturesPerCard,
            ),
          )
        }
        exportLabel="PPTX 다운로드"
      />
    </>
  );
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
    <div className="material-tile">
      <ImagePreview word={word} imageUrl={imageUrl} />
      <strong>{syllables ? word.split('').join(' · ') : word}</strong>
    </div>
  );
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
            <Search size={15} />
            {findMoreLoading ? '다시 찾는 중' : '다시 찾기'}
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
            <Search size={15} />
            {findMoreLoading ? '더 찾는 중' : '사진 더 찾기'}
          </button>
        </div>
      </section>
    </div>
  );
}

function StudentInfo({ grade, klass }: { grade: number; klass: number }) {
  return (
    <div className="student-info" aria-label="학생 정보">
      <span>
        <small>학년</small>
        {grade}
      </span>
      <span>
        <small>반</small>
        {klass}
      </span>
      <span className="student-name">
        <small>이름</small>
      </span>
    </div>
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

function StepperControl({
  ariaLabel,
  title,
  valueLabel,
  description,
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
  description: string;
  minusLabel: string;
  plusLabel: string;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled: boolean;
  plusDisabled: boolean;
}) {
  return (
    <div className="stepper-control" role="group" aria-label={ariaLabel}>
      <div>
        <span className="control-kicker">{title}</span>
        <strong>{valueLabel}</strong>
        <small>{description}</small>
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
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
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

function Callout({ children, tone }: { children: React.ReactNode; tone: 'warning' }) {
  return (
    <div className="callout" data-tone={tone}>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function ActionBar({
  onPrint,
  onExport,
  exportLabel,
}: {
  onPrint: () => void;
  onExport: () => void;
  exportLabel: string;
}) {
  return (
    <div className="action-bar">
      <button className="secondary-button" type="button" onClick={onPrint}>
        <Printer size={15} />
        인쇄
      </button>
      <button className="primary-button" type="button" onClick={onExport}>
        <Download size={15} />
        {exportLabel}
      </button>
    </div>
  );
}

export default App;
