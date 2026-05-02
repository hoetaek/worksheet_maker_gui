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

In the UI, `사진 전체 찾기` searches every word at once, fills each row with the first result, and
caches the alternatives behind the row-level `변경` button. This keeps the default flow fast while
still allowing teachers to choose a better photo when needed.

Google Programmable Search can be added later as another backend provider with API keys and quota
handling. Bing Search APIs are not used because Microsoft has retired the standalone Bing Search API
product.

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
