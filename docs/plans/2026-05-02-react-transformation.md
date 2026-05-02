# React Transformation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the PyQt-first learning material maker with a React application that follows `DESIGN.md` and covers the existing project workflows.

**Architecture:** Use a Vite React/TypeScript app with pure TypeScript modules for word parsing, word search generation, Dobble index generation, worksheet layout data, and flicker slide sequencing. The browser app provides printable/exportable previews rather than depending on Windows-only Python/COM document generation.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, lucide-react, CSS modules/global CSS using the Vercel-inspired design tokens from `DESIGN.md`.

---

### Task 1: Project Scaffold

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/`

**Steps:**

1. Add Vite React scripts for `dev`, `build`, `preview`, and `test`.
2. Add TypeScript/Vitest configuration.
3. Install dependencies.

### Task 2: Core Logic With Tests

**Files:**

- Create: `src/lib/words.ts`
- Create: `src/lib/wordSearch.ts`
- Create: `src/lib/dobble.ts`
- Create: `src/lib/materials.ts`
- Create: `src/lib/*.test.ts`

**Steps:**

1. Write failing tests for mixed Korean/English word parsing and keyword suffix handling.
2. Write failing tests for word search grids containing requested words.
3. Write failing tests for Dobble card indexes where every pair shares exactly one symbol.
4. Implement the minimal logic to pass tests.

### Task 3: React UI

**Files:**

- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`
- Create: `src/components/`

**Steps:**

1. Build the app shell with four main tools: word search, word flicker, word worksheet, and Dobble cards.
2. Add shared word input, keyword preview, image placeholder controls, grade/class settings, and export/print actions.
3. Apply `DESIGN.md` tokens: Geist fonts, white canvas, shadow-as-border cards, restrained neutral palette, 6-8px radius controls, blue focus rings, and workflow accents only as status/context colors.
4. Ensure responsive layout works from mobile to desktop.

### Task 4: Documentation And Verification

**Files:**

- Modify: `README.md`

**Steps:**

1. Update README with React app commands and note the Python implementation is legacy/reference.
2. Run `npm test`.
3. Run `npm run build`.
4. Audit delivered UI and files against `DESIGN.md` and the four existing workflows.
