# UX Readiness Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce teacher uncertainty at the final export step and prevent invalid generated materials, especially Dobble exports with placeholder words.

**Architecture:** Keep the current single-page React structure, but make output readiness explicit in each tool. Extend the shared `ActionBar` for sticky visibility, summaries, and disabled export states; move Dobble word-count rules into small pure helpers; add targeted UI state for sample words and photo readiness without introducing a new state manager.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS modules via `src/styles.css`, FastAPI-backed downloads.

---

## Current Code Map

- Main UI and tool components live in `src/App.tsx`.
- Export buttons are centralized in `ActionBar` at `src/App.tsx:1484`.
- Dobble rendering and export setup live in `DobbleTool` at `src/App.tsx:1054`.
- Dobble math helpers live in `src/lib/dobble.ts`.
- Word parsing/status helpers live in `src/lib/words.ts`.
- Existing UI tests live in `src/App.test.tsx`.
- Styling for layout, mobile, and the action bar lives in `src/styles.css`.

## UX Principles

- **Fitts's Law:** final `인쇄` and `다운로드` actions should stay reachable instead of being buried below long previews.
- **Hick's Law:** Dobble should recommend the valid setting instead of making teachers infer required word counts.
- **Cognitive Load:** invalid previews with `word 14` increase uncertainty; hide invalid output and explain the next action.
- **Jakob's Law:** export controls should behave like familiar production tools: visible, clearly enabled/disabled, and paired with readiness status.

---

### Task 1: Make Export Actions Sticky And Descriptive

**Files:**

- Modify: `src/App.tsx:895-909`, `src/App.tsx:964-979`, `src/App.tsx:1045-1049`, `src/App.tsx:1117-1133`, `src/App.tsx:1484-1504`
- Modify: `src/styles.css:1052-1058`, `src/styles.css:1455-1463`
- Test: `src/App.test.tsx`

**Step 1: Write failing tests**

Add tests near the existing workflow tests:

```tsx
it('keeps export actions visible with a material summary', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.clear(screen.getByLabelText(/단어 목록/i));
  await user.type(screen.getByLabelText(/단어 목록/i), 'cat, dog');
  await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));

  const actionBar = screen.getByRole('region', { name: '출력 작업' });
  expect(within(actionBar).getByText('현재 6장')).toBeInTheDocument();
  expect(within(actionBar).getByText(/단어 · 사진 · 단어\+사진/)).toBeInTheDocument();
  expect(within(actionBar).getByRole('button', { name: 'PPTX 다운로드' })).toBeEnabled();
});
```

**Step 2: Run the targeted test**

Run:

```bash
npm test -- src/App.test.tsx -t "keeps export actions visible"
```

Expected: FAIL because `ActionBar` has no region label or summary.

**Step 3: Extend `ActionBar` props**

Replace the current `ActionBar` implementation with:

```tsx
function ActionBar({
  onPrint,
  onExport,
  exportLabel,
  summary,
  exportDisabled = false,
  disabledReason,
}: {
  onPrint: () => void;
  onExport: () => void;
  exportLabel: string;
  summary?: React.ReactNode;
  exportDisabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <div className="action-bar" role="region" aria-label="출력 작업">
      {summary && <div className="action-summary">{summary}</div>}
      {disabledReason && <p className="action-disabled-reason">{disabledReason}</p>}
      <div className="action-buttons">
        <button
          className="secondary-button"
          type="button"
          onClick={onPrint}
          disabled={exportDisabled}
        >
          <Printer size={15} />
          인쇄
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={onExport}
          disabled={exportDisabled}
        >
          <Download size={15} />
          {exportLabel}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Add summaries at call sites**

Use concise summaries:

```tsx
summary={<span>DOCX · 단어 {words.length}개</span>}
```

For Flicker:

```tsx
const templateLabels = templates
  .map((template) => FLICKER_TEMPLATES.find((item) => item.id === template)?.label)
  .filter(Boolean)
  .join(' · ');

summary={<span>현재 {sequence.length}장 · {templateLabels}</span>}
```

For Dobble, use the valid/invalid state from Task 2.

**Step 5: Make the action bar sticky**

Update CSS:

```css
.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 16px;
  align-items: center;
  margin-top: 24px;
  padding: 14px 24px;
  border-top: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}

.action-summary {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.action-disabled-reason {
  grid-column: 1 / -1;
  color: #9f2d25;
  font-size: 13px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
```

Add mobile fallback:

```css
@media (max-width: 620px) {
  .action-bar {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

**Step 6: Verify**

Run:

```bash
npm test -- src/App.test.tsx -t "keeps export actions visible"
```

Expected: PASS.

---

### Task 2: Prevent Invalid Dobble Preview And Export

**Files:**

- Modify: `src/lib/dobble.ts`
- Modify: `src/lib/dobble.test.ts`
- Modify: `src/App.tsx:1054-1133`
- Test: `src/App.test.tsx`

**Step 1: Write failing helper tests**

Add to `src/lib/dobble.test.ts`:

```ts
import {
  buildDobbleCards,
  dobbleWordCountOptions,
  requiredDobbleWordCount,
  suggestPicturesPerCardForWordCount,
} from './dobble';

it('lists valid dobble picture counts with their required word counts', () => {
  expect(dobbleWordCountOptions()).toEqual([
    { picturesPerCard: 3, requiredWords: 7 },
    { picturesPerCard: 4, requiredWords: 13 },
    { picturesPerCard: 5, requiredWords: 21 },
    { picturesPerCard: 6, requiredWords: 31 },
    { picturesPerCard: 8, requiredWords: 57 },
  ]);
});

it('suggests the closest dobble setting for the current word count', () => {
  expect(suggestPicturesPerCardForWordCount(13)).toBe(4);
  expect(suggestPicturesPerCardForWordCount(12)).toBe(4);
  expect(suggestPicturesPerCardForWordCount(0)).toBe(3);
});
```

**Step 2: Run helper tests**

Run:

```bash
npm test -- src/lib/dobble.test.ts
```

Expected: FAIL because the helpers do not exist.

**Step 3: Implement helpers**

Add to `src/lib/dobble.ts`:

```ts
export type DobbleWordCountOption = {
  picturesPerCard: number;
  requiredWords: number;
};

export function dobbleWordCountOptions(): DobbleWordCountOption[] {
  return validPicturesPerCard().map((picturesPerCard) => ({
    picturesPerCard,
    requiredWords: requiredDobbleWordCount(picturesPerCard),
  }));
}

export function suggestPicturesPerCardForWordCount(wordCount: number): number {
  return dobbleWordCountOptions().reduce((best, option) => {
    const optionDistance = Math.abs(option.requiredWords - wordCount);
    const bestDistance = Math.abs(best.requiredWords - wordCount);
    return optionDistance < bestDistance ? option : best;
  }, dobbleWordCountOptions()[0]).picturesPerCard;
}
```

**Step 4: Write failing UI test**

Add to `src/App.test.tsx`:

```tsx
it('blocks incomplete dobble exports and recommends the matching setting', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.clear(screen.getByLabelText(/단어 목록/i));
  await user.type(
    screen.getByLabelText(/단어 목록/i),
    'one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen',
  );
  await user.click(screen.getByRole('button', { name: /도블 카드/i }));

  expect(screen.getByText(/13개 단어는 카드당 4개 도블에 가장 가깝습니다/)).toBeInTheDocument();
  expect(screen.queryByText('word 14')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: '카드당 4개로 변경' }));

  expect(screen.getByText('13/13 준비됨')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'PPTX 다운로드' })).toBeEnabled();
});
```

**Step 5: Update `DobbleTool`**

Import the helpers:

```ts
import {
  buildDobbleCards,
  dobbleWordCountOptions,
  nearestValidPicturesPerCard,
  requiredDobbleWordCount,
  suggestPicturesPerCardForWordCount,
  validPicturesPerCard,
} from './lib/dobble';
```

Inside `DobbleTool`:

```tsx
const isDobbleReady = words.length === requiredWords;
const suggestedPicturesPerCard = suggestPicturesPerCardForWordCount(words.length);
const suggestedRequiredWords = requiredDobbleWordCount(suggestedPicturesPerCard);
const indexes = useMemo(
  () => (isDobbleReady ? buildDobbleCards(safePicturesPerCard) : []),
  [isDobbleReady, safePicturesPerCard],
);
const symbols = useMemo(() => words.slice(0, requiredWords), [requiredWords, words]);
```

Change `<option>` labels:

```tsx
{
  dobbleWordCountOptions().map((option) => (
    <option value={option.picturesPerCard} key={option.picturesPerCard}>
      {option.picturesPerCard}개 · 단어 {option.requiredWords}개
    </option>
  ));
}
```

Replace invalid preview with:

```tsx
{
  !isDobbleReady ? (
    <Callout tone="warning">
      그림 {safePicturesPerCard}개짜리 도블 카드는 단어 {requiredWords}개가 정확히 필요합니다.{' '}
      {words.length > 0 && (
        <>
          현재 {words.length}개 단어는 카드당 {suggestedPicturesPerCard}개 도블에 가장 가깝습니다.
          <button
            className="inline-action"
            type="button"
            onClick={() => setPicturesPerCard(suggestedPicturesPerCard)}
          >
            카드당 {suggestedPicturesPerCard}개로 변경
          </button>
        </>
      )}
    </Callout>
  ) : (
    <div className="dobble-grid printable">...</div>
  );
}
```

Pass disabled state:

```tsx
<ActionBar
  onPrint={() => window.print()}
  onExport={...}
  exportLabel="PPTX 다운로드"
  summary={<span>PPTX · 카드 {indexes.length}장 · 카드당 그림 {safePicturesPerCard}개</span>}
  exportDisabled={!isDobbleReady}
  disabledReason={
    isDobbleReady ? undefined : `단어 ${requiredWords}개가 정확히 필요합니다.`
  }
/>
```

**Step 6: Add inline action styling**

Add to `src/styles.css`:

```css
.inline-action {
  margin-left: 8px;
  border: 0;
  background: transparent;
  color: var(--develop);
  font-weight: 700;
  text-decoration: underline;
}
```

**Step 7: Verify**

Run:

```bash
npm test -- src/lib/dobble.test.ts
npm test -- src/App.test.tsx -t "blocks incomplete dobble exports"
```

Expected: PASS.

---

### Task 3: Make Photo Readiness Easier To Scan

**Files:**

- Modify: `src/App.tsx:120-145`, `src/App.tsx:440-560`
- Modify: `src/styles.css:310-325`, `src/styles.css:931-960`
- Test: `src/App.test.tsx`

**Step 1: Write failing test**

Add:

```tsx
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
```

**Step 2: Run the test**

Run:

```bash
npm test -- src/App.test.tsx -t "summarizes photo readiness"
```

Expected: FAIL because no summary exists.

**Step 3: Add derived count**

Inside `App` after `keywordRows`:

```tsx
const preparedImageCount = words.filter((word) => Boolean(imageMap[word])).length;
```

Render below or inside `.word-action-panel`:

```tsx
<div className="photo-readiness" aria-live="polite">
  사진 {preparedImageCount}/{words.length} 준비됨
</div>
```

For each ready row, add a small review hint:

```tsx
<span>{imageMap[row.word] ? '사진 준비됨 · 확인 필요' : '사진 없음'}</span>
```

**Step 4: Style the summary**

Add:

```css
.photo-readiness {
  grid-column: 1 / -1;
  min-height: 28px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--surface-tint);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  box-shadow: var(--light-ring);
}
```

**Step 5: Verify**

Run:

```bash
npm test -- src/App.test.tsx -t "summarizes photo readiness"
```

Expected: PASS.

---

### Task 4: Use Tool-Specific Sample Words

**Files:**

- Modify: `src/App.tsx:70-90`, `src/App.tsx:463-482`
- Test: `src/App.test.tsx`

**Step 1: Write failing test**

Add:

```tsx
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
  expect(screen.getByLabelText(/단어 목록/i)).toHaveValue('apple, banana, cat, dog, milk, pencil');
});
```

**Step 2: Run the test**

Run:

```bash
npm test -- src/App.test.tsx -t "uses sample words"
```

Expected: FAIL because only `SAMPLE_WORDS` exists.

**Step 3: Replace sample constant**

Replace `SAMPLE_WORDS` with:

```ts
const SAMPLE_WORDS_BY_TOOL: Record<ToolId, string> = {
  'word-search': '토끼, 거북이, 사자, 강아지, 고양이, 코끼리',
  worksheet: '토끼, 거북이, 사자, 강아지, 고양이, 코끼리',
  flicker: 'apple, banana, cat, dog, milk, pencil',
  dobble:
    'one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty, twenty one, twenty two, twenty three, twenty four, twenty five, twenty six, twenty seven, twenty eight, twenty nine, thirty, thirty one',
};
```

Initialize:

```tsx
const [wordInput, setWordInput] = useState(
  workspaceDraft.wordInput ?? SAMPLE_WORDS_BY_TOOL['word-search'],
);
```

Update the sample button:

```tsx
onClick={() => setWordInput(SAMPLE_WORDS_BY_TOOL[activeTool])}
```

**Step 4: Verify**

Run:

```bash
npm test -- src/App.test.tsx -t "uses sample words"
```

Expected: PASS.

---

### Task 5: Verification Pass

**Files:**

- No source edits unless verification exposes failures.

**Step 1: Run focused frontend tests**

Run:

```bash
npm test -- src/App.test.tsx src/lib/dobble.test.ts
```

Expected: PASS.

**Step 2: Run quality checks**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all PASS.

**Step 3: Run backend tests only if download payloads changed**

If no backend contract changed, skip. If any download payload changes, run:

```bash
uv run pytest
uv run ruff check backend tests
uv run mypy
```

Expected: all PASS.

**Step 4: Manual UI verification**

Start or reuse local servers:

```bash
npm run dev
npm run dev:api
```

Verify at the Vite URL:

- Desktop: export action bar remains visible while scrolling long previews.
- Mobile width around 390px: action buttons fit without text overlap.
- Dobble with 13 words and default 6 pictures/card: no `word 14`, export disabled, recommendation visible.
- Dobble after clicking `카드당 4개로 변경`: card preview appears and export is enabled.
- Flicker: action summary shows slide count and selected template names.
- Worksheet: Korean sample words do not mix English by default.

**Step 5: Final full gate**

Run:

```bash
npm run check
```

Expected: PASS.

---

## Recommended Implementation Order

1. Task 2 first, because invalid Dobble export is the highest-risk behavioral bug.
2. Task 1 next, because sticky export actions benefit every workflow.
3. Task 3 next, because photo readiness reduces review uncertainty with small scope.
4. Task 4 last, because sample words are low risk and mostly onboarding polish.

## Out Of Scope For This Pass

- Re-ranking external image search results by educational suitability.
- Full photo approval workflow with persistent reviewed/unreviewed state.
- Splitting `src/App.tsx` into many files.
- Backend document layout changes.
