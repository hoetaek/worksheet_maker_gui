import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  BookOpen,
  Check,
  Copy,
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
  icon: typeof Search;
  accent: 'develop' | 'preview' | 'ship' | 'neutral';
}> = [
  { id: 'word-search', label: 'Word Search', icon: Search, accent: 'develop' },
  { id: 'worksheet', label: 'Worksheet', icon: FileText, accent: 'neutral' },
  { id: 'flicker', label: 'Flicker', icon: Images, accent: 'preview' },
  { id: 'dobble', label: 'Dobble', icon: Layers3, accent: 'ship' },
];

const SAMPLE_WORDS = '토끼, 거북이, 사자, banana, peach, police_officer';
const FLICKER_TEMPLATES: Array<{ id: FlickerTemplate; label: string }> = [
  { id: 'word', label: 'Word' },
  { id: 'image', label: 'Image' },
  { id: 'word-image', label: 'Both' },
  { id: 'blank', label: 'Blank' },
];

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
    notify('Word list copied');
  }

  function exportJson(payload: unknown, name: string) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
    notify('Export prepared');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="mark" aria-hidden="true">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="mono-label">Material Maker</p>
            <h1>Learning material studio</h1>
          </div>
        </div>

        <button
          className="icon-button mobile-menu"
          type="button"
          aria-label="Toggle tools"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <Menu size={18} />
        </button>

        <nav className={`tool-tabs ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Tools">
          {TOOL_OPTIONS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className={`tab-button accent-${tool.accent}`}
                type="button"
                data-active={activeTool === tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setMobileNavOpen(false);
                }}
              >
                <Icon size={16} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="workspace">
        <section className="control-panel" aria-label="Controls">
          <div className="panel-heading">
            <div>
              <p className="mono-label">Input</p>
              <h2>Words and images</h2>
            </div>
            <Badge tone={wordCountStatus(words.length).tone}>
              {wordCountStatus(words.length).label}
            </Badge>
          </div>

          <label className="field-label" htmlFor="word-input">
            Word list
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
              Sample
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
              Copy
            </button>
          </div>

          <div className="settings-grid">
            <label>
              <span>Suffix</span>
              <input value={suffix} onChange={(event) => setSuffix(event.target.value)} />
            </label>
            <label>
              <span>Search count</span>
              <input
                type="number"
                min={0}
                max={25}
                value={searchCount}
                onChange={(event) => setSearchCount(Number(event.target.value))}
              />
            </label>
            <label>
              <span>Grade</span>
              <input
                type="number"
                min={1}
                max={6}
                value={grade}
                onChange={(event) => setGrade(Number(event.target.value))}
              />
            </label>
            <label>
              <span>Class</span>
              <input
                type="number"
                min={1}
                value={klass}
                onChange={(event) => setKlass(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="keyword-table" aria-label="Keyword rows">
            <div className="keyword-header">
              <span>Word</span>
              <span>Keyword</span>
              <span>Image URL</span>
            </div>
            {keywordRows.length === 0 ? (
              <EmptyState text="Add words to begin." />
            ) : (
              keywordRows.map((row) => (
                <div className="keyword-row" key={row.word}>
                  <span className="word-token">{row.word}</span>
                  <span>{row.keyword}</span>
                  <input
                    aria-label={`${row.word} image URL`}
                    value={imageMap[row.word] ?? ''}
                    onChange={(event) => updateImage(row.word, event.target.value)}
                    placeholder="https://..."
                  />
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
              exportJson={exportJson}
            />
          )}

          {activeTool === 'worksheet' && (
            <WorksheetTool
              words={words}
              grade={grade}
              klass={klass}
              imageMap={imageMap}
              exportJson={exportJson}
            />
          )}

          {activeTool === 'flicker' && (
            <FlickerTool words={words} imageMap={imageMap} exportJson={exportJson} />
          )}

          {activeTool === 'dobble' && (
            <DobbleTool words={words} imageMap={imageMap} exportJson={exportJson} />
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
  language: string;
}) {
  const Icon = tool.icon;

  return (
    <div className="tool-heading">
      <div className="tool-title">
        <Icon size={20} />
        <div>
          <p className="mono-label">{language}</p>
          <h2>{tool.label}</h2>
        </div>
      </div>
      <Badge tone={words.length > 0 ? 'success' : 'neutral'}>{words.length} words</Badge>
    </div>
  );
}

function WordSearchTool({
  words,
  grade,
  klass,
  imageMap,
  exportJson,
}: {
  words: string[];
  grade: number;
  klass: number;
  imageMap: ImageMap;
  exportJson: (payload: unknown, name: string) => void;
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
      return error instanceof Error ? error : new Error('Puzzle generation failed.');
    }
  }, [difficulty, fillerMode, height, uppercase, width, words]);

  const hasError = puzzle instanceof Error;
  const currentGrid = !hasError && puzzle ? (showAnswer ? puzzle.answerGrid : puzzle.grid) : [];

  return (
    <>
      <div className="tool-controls">
        <NumberField label="Width" value={width} min={5} max={28} onChange={setWidth} />
        <NumberField label="Height" value={height} min={5} max={28} onChange={setHeight} />
        <label>
          <span>Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(Number(event.target.value) as WordSearchDifficulty)}
          >
            <option value={1}>Straight</option>
            <option value={2}>Reverse</option>
            <option value={3}>Diagonal</option>
            <option value={4}>All directions</option>
          </select>
        </label>
        <label>
          <span>Fill</span>
          <select
            value={fillerMode}
            onChange={(event) => setFillerMode(event.target.value as FillerMode)}
          >
            <option value="easy">Low overlap</option>
            <option value="balanced">Balanced</option>
            <option value="overlap">High overlap</option>
          </select>
        </label>
        <Toggle label="Uppercase" checked={uppercase} onChange={setUppercase} />
        <Toggle label="Answer" checked={showAnswer} onChange={setShowAnswer} />
      </div>

      {hasError ? (
        <Callout tone="warning">{puzzle.message}</Callout>
      ) : (
        <div className="preview-layout printable">
          <div className="puzzle-sheet">
            <div className="sheet-meta">
              <h3>{/[가-힣]/.test(words.join('')) ? '낱말 찾기' : 'Word Puzzle'}</h3>
              <span>
                {grade}학년 {klass}반 이름: _______
              </span>
            </div>
            <div
              className="puzzle-grid"
              style={{ gridTemplateColumns: `repeat(${Math.max(width, 1)}, minmax(0, 1fr))` }}
            >
              {currentGrid.flat().map((cell, index) => (
                <span className={cell ? '' : 'answer-empty'} key={`${cell}-${index}`}>
                  {cell || '·'}
                </span>
              ))}
            </div>
            <WordImageHints words={words} imageMap={imageMap} uppercase={uppercase} />
          </div>
        </div>
      )}

      <ActionBar
        onPrint={() => window.print()}
        onExport={() =>
          exportJson(
            {
              type: 'word-search',
              words,
              width,
              height,
              difficulty,
              fillerMode,
              uppercase,
              puzzle,
            },
            'word-search.json',
          )
        }
      />
    </>
  );
}

function WorksheetTool({
  words,
  grade,
  klass,
  imageMap,
  exportJson,
}: {
  words: string[];
  grade: number;
  klass: number;
  imageMap: ImageMap;
  exportJson: (payload: unknown, name: string) => void;
}) {
  const [columns, setColumns] = useState(5);
  const [syllables, setSyllables] = useState(false);
  const worksheet = useMemo(() => buildWorksheetCells(words, columns), [columns, words]);

  return (
    <>
      <div className="tool-controls">
        <NumberField label="Columns" value={columns} min={1} max={8} onChange={setColumns} />
        <Toggle label="Syllables" checked={syllables} onChange={setSyllables} />
      </div>

      <div className="worksheet-sheet printable">
        <div className="sheet-meta">
          <h3>단어 활동지</h3>
          <span>
            {grade}학년 {klass}반 이름: _______
          </span>
        </div>
        <div
          className="worksheet-grid"
          style={{ gridTemplateColumns: `repeat(${worksheet.columns}, minmax(96px, 1fr))` }}
        >
          {words.length === 0 ? (
            <EmptyState text="Add words to preview the worksheet." />
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
          exportJson({ type: 'worksheet', columns, syllables, words, imageMap }, 'worksheet.json')
        }
      />
    </>
  );
}

function FlickerTool({
  words,
  imageMap,
  exportJson,
}: {
  words: string[];
  imageMap: ImageMap;
  exportJson: (payload: unknown, name: string) => void;
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
      <div className="template-picker" role="group" aria-label="Slide templates">
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
        <Callout tone="warning">Select at least one slide template.</Callout>
      ) : (
        <div className="flicker-strip printable">
          {sequence.length === 0 ? (
            <EmptyState text="Add words to preview the flicker deck." />
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
        onExport={() =>
          exportJson({ type: 'flicker', templates, sequence, imageMap }, 'flicker-sequence.json')
        }
      />
    </>
  );
}

function DobbleTool({
  words,
  imageMap,
  exportJson,
}: {
  words: string[];
  imageMap: ImageMap;
  exportJson: (payload: unknown, name: string) => void;
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
          <span>Pictures per card</span>
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
          Dobble needs exactly {requiredWords} words for {safePicturesPerCard} pictures per card.
        </Callout>
      )}

      <div className="dobble-grid printable">
        {indexes.map((card, index) => (
          <div className="dobble-card" key={index}>
            <span className="mono-label">Card {index + 1}</span>
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
          exportJson(
            {
              type: 'dobble',
              picturesPerCard: safePicturesPerCard,
              cards: indexes.map((card) => card.map((index) => symbols[index])),
            },
            'dobble-cards.json',
          )
        }
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
    <div className="hint-grid">
      {words.map((word) => (
        <div className="hint-item" key={word}>
          <ImagePreview word={word} imageUrl={imageMap[word]} />
          <span>{uppercase ? word.toUpperCase() : word}</span>
        </div>
      ))}
    </div>
  );
}

function ImagePreview({ word, imageUrl }: { word: string; imageUrl?: string }) {
  if (imageUrl) {
    return <img className="image-preview" src={imageUrl} alt={word} />;
  }

  return (
    <div className="image-placeholder" aria-label={`${word} placeholder`}>
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

function ActionBar({ onPrint, onExport }: { onPrint: () => void; onExport: () => void }) {
  return (
    <div className="action-bar">
      <button className="secondary-button" type="button" onClick={onPrint}>
        <Printer size={15} />
        Print
      </button>
      <button className="primary-button" type="button" onClick={onExport}>
        <ArrowDownToLine size={15} />
        Export
      </button>
    </div>
  );
}

export default App;
