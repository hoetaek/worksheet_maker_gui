사진 기반으로 낱말 찾기, 도블 카드, 단어 깜빡이, 단어 활동지를 제작하는 학습 자료 제작 도구입니다.

## Stack

- Frontend: Vite, React, TypeScript
- Backend: FastAPI
- Python dependency management: `uv`
- Output formats: `.docx` and `.pptx`

## Setup

```bash
npm install
uv sync --all-groups
```

## Development

Run the API and web app in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to FastAPI on port `8000`.

## Photo Search

The app searches photos through the FastAPI backend at `/api/images/search` instead of scraping
Google Images or Bing Images directly. The default provider mode is `auto`:

- Korean queries search Wikimedia Commons first, then Openverse.
- English queries search Openverse first, then Wikimedia Commons.
- File/media suffixes such as `png`, `jpg`, `photo`, `사진`, and `이미지` are retried without the suffix when the exact query is sparse.
- Korean search terms are expanded with an English image-search candidate through the backend
  translation lookup, such as `거북이` → `turtle`, while the original Korean query remains as a
  fallback.

In the UI, `사진 전체 찾기` is the primary action below the word list. It searches every word at
once, fills each row with the first result, and caches the alternatives behind the row-level
`다른 사진` button. This keeps the default flow fast while still allowing teachers to choose a better
photo when needed.

Running `사진 전체 찾기` again only fills rows that still have no photo. It does not overwrite photos
the teacher already selected.

The word list shows each word as a photo row with a thumbnail, photo status, and nearby actions.
Direct URL entry, provider controls, and search-count controls stay out of the default workflow.

Photo candidates are displayed inside fixed frames with the whole image visible, so very wide or tall
source images do not break the picker layout.

If a teacher wants more options, the photo picker has `사진 더 찾기`. The browser also keeps the
current word list, selected photos, and cached alternatives across refreshes.

When Korean results are weak, the photo picker also lets teachers change the search phrase and try a
clearer English name such as `turtle` or `sea turtle` without adding a separate search column to the
main word list. The picker opens with the backend search term that actually produced the current
results, so a translated search like `turtle` is visible instead of only the original word `거북이`.

Google Programmable Search can be added later as another backend provider with API keys and quota
handling. Bing Search APIs are not used because Microsoft has retired the standalone Bing Search API
product.

## Word Search UX

`낱말 찾기` keeps setup intentionally small:

- Puzzle size is one square control such as `15 x 15`, not separate width and height fields.
- Difficulty moves up or down with two buttons and Korean learner-facing labels.
- Filler behavior is chosen through three option cards: `쉽게 찾기`, `균형 있게`, `더 어렵게`.
- `찾을 낱말` uses larger image-led hint cards in the preview and larger hint images in the generated
  DOCX because photos are part of the core learning material.
- The word list is saved in browser storage, so refreshing the page does not erase the current work.

## Quality Gates

```bash
npm run check
npm test
npm run build
uv run pytest
uv run ruff check backend tests
uv run mypy
```

## Project Structure

```text
backend/     FastAPI API, photo search, Office document generators
src/         React app, UI tests, worksheet generation logic
tests/       Backend API and document generation tests
docs/        Migration and implementation notes
```

## Production Serve

```bash
npm run build
npm run serve
```

The FastAPI app serves the built `dist/` assets when they exist.

Document generation lives in the FastAPI backend. The legacy PyQt implementation has been removed from the active codebase.
