그림 기반으로 낱말 찾기, 도블 카드, 단어 깜빡이, 단어 활동지를 제작하는 학습 자료 제작 도구입니다.

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

## Quality Gates

```bash
npm run check
npm test
npm run build
uv run pytest
uv run ruff check backend tests
uv run mypy
```

## Production Serve

```bash
npm run build
npm run serve
```

The FastAPI app serves the built `dist/` assets when they exist.

The original PyQt/Python files remain in the repository as legacy reference material only. New document generation lives in the FastAPI backend.
