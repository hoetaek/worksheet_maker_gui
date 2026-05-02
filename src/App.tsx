import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  Grid3X3,
  Images,
  Layers3,
  Menu,
  Printer,
  Search,
  Sparkles,
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
import { searchBackendImages } from './lib/imageSearch';
import { buildFlickerSequence, buildWorksheetCells, type FlickerTemplate } from './lib/materials';
import { createWordSearch, type FillerMode, type WordSearchDifficulty } from './lib/wordSearch';
import { buildKeywordRows, detectLanguage, parseWords, wordCountStatus } from './lib/words';

type ToolId = 'word-search' | 'worksheet' | 'flicker' | 'dobble';

type ImageMap = Record<string, string>;

type Toast = {
  id: number;
  text: string;
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
  { id: 'image', label: '이미지' },
  { id: 'word-image', label: '단어+이미지' },
  { id: 'blank', label: '빈 슬라이드' },
];

const LANGUAGE_LABELS = {
  english: '영어',
  korean: '한글',
  mixed: '혼합',
} as const;

function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('word-search');
  const [wordInput, setWordInput] = useState(SAMPLE_WORDS);
  const [suffix, setSuffix] = useState('png');
  const [searchCount, setSearchCount] = useState(5);
  const [imageMap, setImageMap] = useState<ImageMap>({});
  const [grade, setGrade] = useState(3);
  const [klass, setKlass] = useState(1);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [imageLoadingWord, setImageLoadingWord] = useState<string | null>(null);

  const words = useMemo(() => parseWords(wordInput), [wordInput]);
  const keywordRows = useMemo(
    () => buildKeywordRows(words, suffix, searchCount),
    [searchCount, suffix, words],
  );
  const language = detectLanguage(words);
  const activeToolConfig = TOOL_OPTIONS.find((tool) => tool.id === activeTool) ?? TOOL_OPTIONS[0];

  function notify(text: string) {
    const nextToast = { id: Date.now(), text };
    setToast(nextToast);
    window.setTimeout(() => {
      setToast((current) => (current?.id === nextToast.id ? null : current));
    }, 2200);
  }

  function updateImage(word: string, value: string) {
    setImageMap((current) => ({ ...current, [word]: value }));
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
      const [candidate] = await searchBackendImages(row.keyword, { limit: searchCount });
      if (!candidate) {
        notify('검색된 이미지가 없습니다.');
        return;
      }
      updateImage(row.word, candidate.imageUrl);
      notify(`${row.word} 이미지를 가져왔습니다.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '이미지 검색에 실패했습니다.');
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
        notify(`${word} 이미지를 추가했습니다.`);
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
              <h2>단어와 이미지</h2>
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

          <div className="inline-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setWordInput(SAMPLE_WORDS)}
            >
              <Grid3X3 size={15} />
              예시
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
              복사
            </button>
          </div>

          <div className="settings-grid">
            <label>
              <span>검색어 접미어</span>
              <input value={suffix} onChange={(event) => setSuffix(event.target.value)} />
            </label>
            <label>
              <span>검색 개수</span>
              <input
                type="number"
                min={1}
                max={12}
                value={searchCount}
                onChange={(event) => setSearchCount(Number(event.target.value))}
              />
            </label>
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

          <div className="keyword-table" aria-label="검색어 목록">
            <div className="keyword-header">
              <span>단어</span>
              <span>검색어</span>
              <span>이미지 URL</span>
            </div>
            {keywordRows.length === 0 ? (
              <EmptyState text="단어를 입력하면 검색어가 만들어집니다." />
            ) : (
              keywordRows.map((row) => (
                <div className="keyword-row" key={row.word}>
                  <span className="word-token">{row.word}</span>
                  <span>{row.keyword}</span>
                  <div className="image-controls">
                    <input
                      aria-label={`${row.word} 이미지 URL`}
                      value={imageMap[row.word] ?? ''}
                      onChange={(event) => updateImage(row.word, event.target.value)}
                      placeholder="이미지 URL"
                    />
                    <button
                      className="tiny-button"
                      type="button"
                      onClick={() => {
                        void findImage(row);
                      }}
                      disabled={imageLoadingWord === row.word}
                    >
                      {imageLoadingWord === row.word ? '검색 중' : '찾기'}
                    </button>
                    <label className="tiny-upload">
                      업로드
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

      {toast && <div className="toast">{toast.text}</div>}
    </div>
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
  const [width, setWidth] = useState(15);
  const [height, setHeight] = useState(15);
  const [difficulty, setDifficulty] = useState<WordSearchDifficulty>(1);
  const [fillerMode, setFillerMode] = useState<FillerMode>('easy');
  const [uppercase, setUppercase] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const puzzle = useMemo(() => {
    if (words.length === 0) {
      return null;
    }

    try {
      return createWordSearch({
        words,
        width,
        height,
        difficulty,
        fillerMode,
        uppercase,
        seed: 20260502,
      });
    } catch (error) {
      return error instanceof Error ? error : new Error('퍼즐을 만들 수 없습니다.');
    }
  }, [difficulty, fillerMode, height, uppercase, width, words]);

  const hasError = puzzle instanceof Error;
  const generatedPuzzle = !hasError && puzzle ? puzzle : null;
  const currentGrid = !hasError && puzzle ? (showAnswer ? puzzle.answerGrid : puzzle.grid) : [];

  return (
    <>
      <div className="tool-controls">
        <NumberField label="가로 칸" value={width} min={5} max={28} onChange={setWidth} />
        <NumberField label="세로 칸" value={height} min={5} max={28} onChange={setHeight} />
        <label>
          <span>난이도</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(Number(event.target.value) as WordSearchDifficulty)}
          >
            <option value={1}>가로세로</option>
            <option value={2}>역방향 포함</option>
            <option value={3}>대각선 포함</option>
            <option value={4}>모든 방향</option>
          </select>
        </label>
        <label>
          <span>채움 방식</span>
          <select
            value={fillerMode}
            onChange={(event) => setFillerMode(event.target.value as FillerMode)}
          >
            <option value="easy">겹침 적게</option>
            <option value="balanced">균형</option>
            <option value="overlap">겹침 많게</option>
          </select>
        </label>
        <Toggle label="대문자" checked={uppercase} onChange={setUppercase} />
        <Toggle label="정답 보기" checked={showAnswer} onChange={setShowAnswer} />
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
                  {width} x {height}
                </span>
                <span>단어 {words.length}개</span>
              </div>
            </div>
            <div className="puzzle-board-wrap">
              <StudentInfo grade={grade} klass={klass} />
              <div
                className="puzzle-grid"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(width, 1)}, minmax(0, 1fr))`,
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
        <span>이미지 힌트</span>
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
    <div className="image-placeholder" aria-label={`${word} 이미지 자리`}>
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
