# Premium Learning Material Studio Design System

## 0. Product-Specific Direction

This project is not a marketing landing page. It is a premium Korean learning-material production studio for teachers. The interface should feel like a calm professional tool, while the generated worksheet previews should feel like polished printable artifacts.

The visual baseline borrows Vercel's restraint: white canvas, near-black typography, shadow-as-border, tight controls, and precise spacing. But the product needs more warmth, larger readable Korean type, clearer navigation states, and output previews that feel like premium paper sheets rather than raw tables.

**Primary goals:**
- Make the navigation unmistakable: Korean labels, strong active state, readable hover state, and enough button width.
- Make output previews feel premium: larger titles, paper-like white surfaces, subtle shadow depth, clear metadata blocks, and no old-fashioned underscore fields.
- Keep the app utilitarian: no decorative blobs, no marketing hero, no card overload, no low-contrast controls.
- Make photo handling central: word/photo rows, full-list photo search, upload affordances, and visual hint cards should be first-class UI.
- Preserve the Vercel-inspired discipline: achromatic palette, `#171717` text, shadow borders, 6-8px radii, blue focus rings, and minimal accent usage.

**Korean UI rules:**
- All visible navigation and workflow controls must be Korean.
- Use larger Korean headings than English defaults: tool headings 28px, output sheet titles 36px or larger.
- Avoid placeholder-like printed fields such as `이름: _______`. Use structured student info blocks with labels for 학년, 반, 이름.
- Buttons must remain readable in every state. Selected navigation tabs use a light surface plus accent line; dark fills are reserved for true primary actions such as export.

**Output preview rules:**
- Word search previews should render inside a sheet-like canvas with a separate board frame.
- Puzzle cells should have stable square dimensions, high contrast letters, and subtle ring lines.
- Worksheet and card previews should use image-led tiles with generous spacing.
- Download actions should produce real `.pptx`/`.docx` artifacts through the FastAPI backend, not JSON exports.

**Laws of UX application:**
Reference: Laws of UX by Jon Yablonski, CC BY-NC-ND 4.0.

- Fitts's Law: primary navigation, download, print, search, and upload controls need generous hit targets and clear spacing. Header tabs should be at least 56px tall on desktop and remain easy to tap on mobile.
- Jakob's Law: keep the app shaped like a familiar production tool. Use sticky top navigation, a left input panel, a right preview workspace, standard form controls, and predictable Korean labels.
- Hick's Law: group choices by task. Keep the four main workflows in one persistent nav, keep puzzle settings in one controls row, and avoid mixing export actions into configuration areas.
- Aesthetic-Usability Effect: generated previews should look like finished print material. Premium paper surfaces, larger titles, structured student info, and image-led hint cards are part of usability because they make the final artifact easier to trust.
- Law of Proximity: related labels, fields, and controls must be visually grouped. Word/photo controls live in each word row; output metadata stays inside the sheet header; export actions stay in the bottom action bar.
- Tesler's Law: document generation complexity belongs in the FastAPI backend. The frontend should expose simple Korean controls while the backend handles `.pptx`/`.docx` generation and image fetching.
- Hick's Law: photo search should default to the lowest-friction path. `사진 전체 찾기` fills empty photo rows automatically, while `다른 사진` progressively discloses alternate candidates only when the teacher wants to review them.
- Doherty Threshold: photo search and downloads should give immediate feedback through disabled/loading button states and short Korean toast messages.
- Law of Proximity: row-level thumbnail, word, photo status, find, alternate-photo, and upload controls stay in the same row so each action clearly belongs to that word.
- Occam's Razor: word-search sizing is one square-size control, not separate width and height inputs. A teacher chooses puzzle scale, while the app preserves square cells for printing.
- Hick's Law: word-search difficulty is a small stepper with named levels. Teachers should not parse a technical direction list before previewing the worksheet.
- Chunking: filler behavior is presented as three Korean option cards. Each card names the learner-facing effect first and hides algorithmic wording.

---

# Legacy Visual Inspiration: Vercel

## 1. Visual Theme & Atmosphere

Vercel's website is the visual thesis of developer infrastructure made invisible — a design system so restrained it borders on philosophical. The page is overwhelmingly white (`#ffffff`) with near-black (`#171717`) text, creating a gallery-like emptiness where every element earns its pixel. This isn't minimalism as decoration; it's minimalism as engineering principle. The Geist design system treats the interface like a compiler treats code — every unnecessary token is stripped away until only structure remains.

The custom Geist font family is the crown jewel. Geist Sans uses aggressive negative letter-spacing (-2.4px to -2.88px at display sizes), creating headlines that feel compressed, urgent, and engineered — like code that's been minified for production. At body sizes, the tracking relaxes but the geometric precision persists. Geist Mono completes the system as the monospace companion for code, terminal output, and technical labels. Both fonts enable OpenType `"liga"` (ligatures) globally, adding a layer of typographic sophistication that rewards close reading.

What distinguishes Vercel from other monochrome design systems is its shadow-as-border philosophy. Instead of traditional CSS borders, Vercel uses `box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.08)` — a zero-offset, zero-blur, 1px-spread shadow that creates a border-like line without the box model implications. This technique allows borders to exist in the shadow layer, enabling smoother transitions, rounded corners without clipping, and a subtler visual weight than traditional borders. The entire depth system is built on layered, multi-value shadow stacks where each layer serves a specific purpose: one for the border, one for soft elevation, one for ambient depth.

**Key Characteristics:**
- Geist Sans with extreme negative letter-spacing (-2.4px to -2.88px at display) — text as compressed infrastructure
- Geist Mono for code and technical labels with OpenType `"liga"` globally
- Shadow-as-border technique: `box-shadow 0px 0px 0px 1px` replaces traditional borders throughout
- Multi-layer shadow stacks for nuanced depth (border + elevation + ambient in single declarations)
- Near-pure white canvas with `#171717` text — not quite black, creating micro-contrast softness
- Workflow-specific accent colors: Ship Red (`#ff5b4f`), Preview Pink (`#de1d8d`), Develop Blue (`#0a72ef`)
- Focus ring system using `hsla(212, 100%, 48%, 1)` — a saturated blue for accessibility
- Pill badges (9999px) with tinted backgrounds for status indicators

## 2. Color Palette & Roles

### Primary
- **Vercel Black** (`#171717`): Primary text, headings, dark surface backgrounds. Not pure black — the slight warmth prevents harshness.
- **Pure White** (`#ffffff`): Page background, card surfaces, button text on dark.
- **True Black** (`#000000`): Secondary use, `--geist-console-text-color-default`, used in specific console/code contexts.

### Workflow Accent Colors
- **Ship Red** (`#ff5b4f`): `--ship-text`, the "ship to production" workflow step — warm, urgent coral-red.
- **Preview Pink** (`#de1d8d`): `--preview-text`, the preview deployment workflow — vivid magenta-pink.
- **Develop Blue** (`#0a72ef`): `--develop-text`, the development workflow — bright, focused blue.

### Console / Code Colors
- **Console Blue** (`#0070f3`): `--geist-console-text-color-blue`, syntax highlighting blue.
- **Console Purple** (`#7928ca`): `--geist-console-text-color-purple`, syntax highlighting purple.
- **Console Pink** (`#eb367f`): `--geist-console-text-color-pink`, syntax highlighting pink.

### Interactive
- **Link Blue** (`#0072f5`): Primary link color with underline decoration.
- **Focus Blue** (`hsla(212, 100%, 48%, 1)`): `--ds-focus-color`, focus ring on interactive elements.
- **Ring Blue** (`rgba(147, 197, 253, 0.5)`): `--tw-ring-color`, Tailwind ring utility.

### Neutral Scale
- **Gray 900** (`#171717`): Primary text, headings, nav text.
- **Gray 600** (`#4d4d4d`): Secondary text, description copy.
- **Gray 500** (`#666666`): Tertiary text, muted links.
- **Gray 400** (`#808080`): Placeholder text, disabled states.
- **Gray 100** (`#ebebeb`): Borders, card outlines, dividers.
- **Gray 50** (`#fafafa`): Subtle surface tint, inner shadow highlight.

### Surface & Overlay
- **Overlay Backdrop** (`hsla(0, 0%, 98%, 1)`): `--ds-overlay-backdrop-color`, modal/dialog backdrop.
- **Selection Text** (`hsla(0, 0%, 95%, 1)`): `--geist-selection-text-color`, text selection highlight.
- **Badge Blue Bg** (`#ebf5ff`): Pill badge background, tinted blue surface.
- **Badge Blue Text** (`#0068d6`): Pill badge text, darker blue for readability.

### Shadows & Depth
- **Border Shadow** (`rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`): The signature — replaces traditional borders.
- **Subtle Elevation** (`rgba(0, 0, 0, 0.04) 0px 2px 2px`): Minimal lift for cards.
- **Card Stack** (`rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px`): Full multi-layer card shadow.
- **Ring Border** (`rgb(235, 235, 235) 0px 0px 0px 1px`): Light gray ring-border for tabs and images.

## 3. Typography Rules

### Font Family
- **Primary**: `Geist`, with fallbacks: `Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol`
- **Monospace**: `Geist Mono`, with fallbacks: `ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Liberation Mono, DejaVu Sans Mono, Courier New`
- **OpenType Features**: `"liga"` enabled globally on all Geist text; `"tnum"` for tabular numbers on specific captions.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Geist | 48px (3.00rem) | 600 | 1.00–1.17 (tight) | -2.4px to -2.88px | Maximum compression, billboard impact |
| Section Heading | Geist | 40px (2.50rem) | 600 | 1.20 (tight) | -2.4px | Feature section titles |
| Sub-heading Large | Geist | 32px (2.00rem) | 600 | 1.25 (tight) | -1.28px | Card headings, sub-sections |
| Sub-heading | Geist | 32px (2.00rem) | 400 | 1.50 | -1.28px | Lighter sub-headings |
| Card Title | Geist | 24px (1.50rem) | 600 | 1.33 | -0.96px | Feature cards |
| Card Title Light | Geist | 24px (1.50rem) | 500 | 1.33 | -0.96px | Secondary card headings |
| Body Large | Geist | 20px (1.25rem) | 400 | 1.80 (relaxed) | normal | Introductions, feature descriptions |
| Body | Geist | 18px (1.13rem) | 400 | 1.56 | normal | Standard reading text |
| Body Small | Geist | 16px (1.00rem) | 400 | 1.50 | normal | Standard UI text |
| Body Medium | Geist | 16px (1.00rem) | 500 | 1.50 | normal | Navigation, emphasized text |
| Body Semibold | Geist | 16px (1.00rem) | 600 | 1.50 | -0.32px | Strong labels, active states |
| Button / Link | Geist | 14px (0.88rem) | 500 | 1.43 | normal | Buttons, links, captions |
| Button Small | Geist | 14px (0.88rem) | 400 | 1.00 (tight) | normal | Compact buttons |
| Caption | Geist | 12px (0.75rem) | 400–500 | 1.33 | normal | Metadata, tags |
| Mono Body | Geist Mono | 16px (1.00rem) | 400 | 1.50 | normal | Code blocks |
| Mono Caption | Geist Mono | 13px (0.81rem) | 500 | 1.54 | normal | Code labels |
| Mono Small | Geist Mono | 12px (0.75rem) | 500 | 1.00 (tight) | normal | `text-transform: uppercase`, technical labels |
| Micro Badge | Geist | 7px (0.44rem) | 700 | 1.00 (tight) | normal | `text-transform: uppercase`, tiny badges |

### Principles
- **Compression as identity**: Geist Sans at display sizes uses -2.4px to -2.88px letter-spacing — the most aggressive negative tracking of any major design system. This creates text that feels _minified_, like code optimized for production. The tracking progressively relaxes as size decreases: -1.28px at 32px, -0.96px at 24px, -0.32px at 16px, and normal at 14px.
- **Ligatures everywhere**: Every Geist text element enables OpenType `"liga"`. Ligatures aren't decorative — they're structural, creating tighter, more efficient glyph combinations.
- **Three weights, strict roles**: 400 (body/reading), 500 (UI/interactive), 600 (headings/emphasis). No bold (700) except for tiny micro-badges. This narrow weight range creates hierarchy through size and tracking, not weight.
- **Mono for identity**: Geist Mono in uppercase with `"tnum"` or `"liga"` serves as the "developer console" voice — compact technical labels that connect the marketing site to the product.

## 4. Component Stylings

### Buttons

**Primary White (Shadow-bordered)**
- Background: `#ffffff`
- Text: `#171717`
- Padding: 0px 6px (minimal — content-driven width)
- Radius: 6px (subtly rounded)
- Shadow: `rgb(235, 235, 235) 0px 0px 0px 1px` (ring-border)
- Hover: background shifts to `var(--ds-gray-1000)` (dark)
- Focus: `2px solid var(--ds-focus-color)` outline + `var(--ds-focus-ring)` shadow
- Use: Standard secondary button

**Primary Dark (Inferred from Geist system)**
- Background: `#171717`
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 6px
- Use: Primary CTA ("Start Deploying", "Get Started")

**Pill Button / Badge**
- Background: `#ebf5ff` (tinted blue)
- Text: `#0068d6`
- Padding: 0px 10px
- Radius: 9999px (full pill)
- Font: 12px weight 500
- Use: Status badges, tags, feature labels

**Large Pill (Navigation)**
- Background: transparent or `#171717`
- Radius: 64px–100px
- Use: Tab navigation, section selectors

### Cards & Containers
- Background: `#ffffff`
- Border: via shadow — `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`
- Radius: 8px (standard), 12px (featured/image cards)
- Shadow stack: `rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px`
- Image cards: `1px solid #ebebeb` with 12px top radius
- Hover: subtle shadow intensification

### Inputs & Forms
- Radio: standard styling with focus `var(--ds-gray-200)` background
- Focus shadow: `1px 0 0 0 var(--ds-gray-alpha-600)`
- Focus outline: `2px solid var(--ds-focus-color)` — consistent blue focus ring
- Border: via shadow technique, not traditional border

### Navigation
- Clean horizontal nav on white, sticky
- Vercel logotype left-aligned, 262x52px
- Links: Geist 14px weight 500, `#171717` text
- Active: weight 600 or underline
- CTA: dark pill buttons ("Start Deploying", "Contact Sales")
- Mobile: hamburger menu collapse
- Product dropdowns with multi-level menus

### Image Treatment
- Product screenshots with `1px solid #ebebeb` border
- Top-rounded images: `12px 12px 0px 0px` radius
- Dashboard/code preview screenshots dominate feature sections
- Soft gradient backgrounds behind hero images (pastel multi-color)

## 4.1 Photo Search Interaction

Photo search is a primary workflow, not a secondary utility.

- Default mode is `자동 추천`; Korean queries prefer Wikimedia Commons first, and English queries prefer Openverse first.
- Korean terms can be expanded through a backend translation lookup before image search. This must remain best-effort: try the translated English candidate for better global image recall, then keep the original Korean query as fallback so cultural/proper terms are not lost.
- The word list shows thumbnail-led photo rows. It should not show a separate search-term column in the default state.
- URL entry, search count, and provider selection are implementation details. The default web UI should not ask teachers to think like search-engine operators.
- `사진 전체 찾기` is the main action. It appears as the first, full-width primary action below the word list, searches all current words, fills each row with the first result, and reports partial misses in one concise toast.
- `예시 단어 넣기` and `단어 복사` are secondary utilities. They should remain visually lighter than photo search.
- Each row keeps a `다른 사진` button. It opens a focused candidate picker with a recommended first result, source metadata, and large `이 사진 사용` targets.
- The candidate picker must show the current row photo as `현재 선택` and disable its action as `사용 중`; only real alternatives should remain actionable.
- The candidate picker may expose `검색어 바꾸기` as progressive disclosure. Keep it inside the modal, not the main word list. UX writing should explain that English names or more specific phrases can work better when Korean results are weak.
- The picker search input should show the backend search term that produced the visible result set. If `거북이` yielded images through `turtle`, the visible editable query should be `turtle`.
- Candidate photos use a fixed frame with `object-fit: contain`; teachers should see the whole image even when source dimensions vary wildly.
- If the teacher wants more options, the candidate picker exposes `사진 더 찾기`. This expands results as an exploration action instead of exposing a search-count setting upfront.
- The app persists the current word list, selected photos, and cached alternatives in browser storage so refreshes do not erase photo-selection work.
- `사진 전체 찾기` fills only words that still have no selected image. It must never silently overwrite teacher-selected photos.
- The candidate picker must not open automatically after every search. Automatic filling keeps the happy path short; manual changing handles exceptions.

## 4.2 Workflow User Paths

The left panel is the shared preparation path for every tool: enter words, fill photos, replace only bad matches, then export from the selected workflow.

- `낱말 찾기`: teacher enters words, fills photos, adjusts one square puzzle size if needed, nudges difficulty up/down, picks a learner-facing filler style, checks the preview and optional answer view, then exports DOCX.
- `단어 활동지`: teacher enters words, fills photos, chooses columns and optional `음절 표시`, checks the tile preview, then exports DOCX.
- `단어 깜빡이`: teacher enters words, fills photos, chooses slide templates, checks the sequence preview, then exports PPTX.
- `도블 카드`: teacher enters the exact required word count for the selected card size, fills photos, checks the warning/status badge, then exports PPTX.

UX validation:

- Next actions must be visible without reading instructions.
- Shared photo work must survive switching tools and refreshing the page.
- Each workflow keeps only its own necessary controls in the right panel.
- Export actions stay at the bottom so settings and output are not visually mixed.

First-principles review:

- Core outcome: a teacher wants printable or slide-ready material with the right words and photos.
- Necessary input: word list and student metadata.
- Necessary review: selected photos and generated preview.
- Necessary control: only settings that visibly change the student artifact.
- Unnecessary default burden: search provider, image URL, image count, separate query field, separate width/height fields, or algorithmic filler labels.
- Photo prominence: if images are the learning anchor, `찾을 낱말` must use image-led cards instead of tiny thumbnails, and generated DOCX hints should preserve that hierarchy.
- Future gallery path: keep a reusable history of word-photo pairs, but present it as an optional reuse drawer after the current creation path is stable.

### Distinctive Components

**Workflow Pipeline**
- Three-step horizontal pipeline: Develop → Preview → Ship
- Each step has its own accent color: Blue → Pink → Red
- Connected with lines/arrows
- The visual metaphor for Vercel's core value proposition

**Trust Bar / Logo Grid**
- Company logos (Perplexity, ChatGPT, Cursor, etc.) in grayscale
- Horizontal scroll or grid layout
- Subtle `#ebebeb` border separation

**Metric Cards**
- Large number display (e.g., "10x faster")
- Geist 48px weight 600 for the metric
- Description below in gray body text
- Shadow-bordered card container

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 1px, 2px, 3px, 4px, 5px, 6px, 8px, 10px, 12px, 14px, 16px, 32px, 36px, 40px
- Notable gap: jumps from 16px to 32px — no 20px or 24px in primary scale

### Grid & Container
- Max content width: approximately 1200px
- Hero: centered single-column with generous top padding
- Feature sections: 2–3 column grids for cards
- Full-width dividers using `border-bottom: 1px solid #171717`
- Code/dashboard screenshots as full-width or contained with border

### Whitespace Philosophy
- **Gallery emptiness**: Massive vertical padding between sections (80px–120px+). The white space IS the design — it communicates that Vercel has nothing to prove and nothing to hide.
- **Compressed text, expanded space**: The aggressive negative letter-spacing on headlines is counterbalanced by generous surrounding whitespace. The text is dense; the space around it is vast.
- **Section rhythm**: White sections alternate with white sections — there's no color variation between sections. Separation comes from borders (shadow-borders) and spacing alone.

### Border Radius Scale
- Micro (2px): Inline code snippets, small spans
- Subtle (4px): Small containers
- Standard (6px): Buttons, links, functional elements
- Comfortable (8px): Cards, list items
- Image (12px): Featured cards, image containers (top-rounded)
- Large (64px): Tab navigation pills
- XL (100px): Large navigation links
- Full Pill (9999px): Badges, status pills, tags
- Circle (50%): Menu toggle, avatar containers

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, text blocks |
| Ring (Level 1) | `rgba(0,0,0,0.08) 0px 0px 0px 1px` | Shadow-as-border for most elements |
| Light Ring (Level 1b) | `rgb(235,235,235) 0px 0px 0px 1px` | Lighter ring for tabs, images |
| Subtle Card (Level 2) | Ring + `rgba(0,0,0,0.04) 0px 2px 2px` | Standard cards with minimal lift |
| Full Card (Level 3) | Ring + Subtle + `rgba(0,0,0,0.04) 0px 8px 8px -8px` + inner `#fafafa` ring | Featured cards, highlighted panels |
| Focus (Accessibility) | `2px solid hsla(212, 100%, 48%, 1)` outline | Keyboard focus on all interactive elements |

**Shadow Philosophy**: Vercel has arguably the most sophisticated shadow system in modern web design. Rather than using shadows for elevation in the traditional Material Design sense, Vercel uses multi-value shadow stacks where each layer has a distinct architectural purpose: one creates the "border" (0px spread, 1px), another adds ambient softness (2px blur), another handles depth at distance (8px blur with negative spread), and an inner ring (`#fafafa`) creates the subtle highlight that makes the card "glow" from within. This layered approach means cards feel built, not floating.

### Decorative Depth
- Hero gradient: soft, pastel multi-color gradient wash behind hero content (barely visible, atmospheric)
- Section borders: `1px solid #171717` (full dark line) between major sections
- No background color variation — depth comes entirely from shadow layering and border contrast

## 7. Do's and Don'ts

### Do
- Use Geist Sans with aggressive negative letter-spacing at display sizes (-2.4px to -2.88px at 48px)
- Use shadow-as-border (`0px 0px 0px 1px rgba(0,0,0,0.08)`) instead of traditional CSS borders
- Enable `"liga"` on all Geist text — ligatures are structural, not optional
- Use the three-weight system: 400 (body), 500 (UI), 600 (headings)
- Apply workflow accent colors (Red/Pink/Blue) only in their workflow context
- Use multi-layer shadow stacks for cards (border + elevation + ambient + inner highlight)
- Keep the color palette achromatic — grays from `#171717` to `#ffffff` are the system
- Use `#171717` instead of `#000000` for primary text — the micro-warmth matters

### Don't
- Don't use positive letter-spacing on Geist Sans — it's always negative or zero
- Don't use weight 700 (bold) on body text — 600 is the maximum, used only for headings
- Don't use traditional CSS `border` on cards — use the shadow-border technique
- Don't introduce warm colors (oranges, yellows, greens) into the UI chrome
- Don't apply the workflow accent colors (Ship Red, Preview Pink, Develop Blue) decoratively
- Don't use heavy shadows (> 0.1 opacity) — the shadow system is whisper-level
- Don't increase body text letter-spacing — Geist is designed to run tight
- Don't use pill radius (9999px) on primary action buttons — pills are for badges/tags only
- Don't skip the inner `#fafafa` ring in card shadows — it's the glow that makes the system work

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile Small | <400px | Tight single column, minimal padding |
| Mobile | 400–600px | Standard mobile, stacked layout |
| Tablet Small | 600–768px | 2-column grids begin |
| Tablet | 768–1024px | Full card grids, expanded padding |
| Desktop Small | 1024–1200px | Standard desktop layout |
| Desktop | 1200–1400px | Full layout, maximum content width |
| Large Desktop | >1400px | Centered, generous margins |

### Touch Targets
- Buttons use comfortable padding (8px–16px vertical)
- Navigation links at 14px with adequate spacing
- Pill badges have 10px horizontal padding for tap targets
- Mobile menu toggle uses 50% radius circular button

### Collapsing Strategy
- Hero: display 48px → scales down, maintains negative tracking proportionally
- Navigation: horizontal links + CTAs → hamburger menu
- Feature cards: 3-column → 2-column → single column stacked
- Code screenshots: maintain aspect ratio, may horizontally scroll
- Trust bar logos: grid → horizontal scroll
- Footer: multi-column → stacked single column
- Section spacing: 80px+ → 48px on mobile

### Image Behavior
- Dashboard screenshots maintain border treatment at all sizes
- Hero gradient softens/simplifies on mobile
- Product screenshots use responsive images with consistent border radius
- Full-width sections maintain edge-to-edge treatment

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Vercel Black (`#171717`)
- Background: Pure White (`#ffffff`)
- Heading text: Vercel Black (`#171717`)
- Body text: Gray 600 (`#4d4d4d`)
- Border (shadow): `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`
- Link: Link Blue (`#0072f5`)
- Focus ring: Focus Blue (`hsla(212, 100%, 48%, 1)`)

### Example Component Prompts
- "Create a hero section on white background. Headline at 48px Geist weight 600, line-height 1.00, letter-spacing -2.4px, color #171717. Subtitle at 20px Geist weight 400, line-height 1.80, color #4d4d4d. Dark CTA button (#171717, 6px radius, 8px 16px padding) and ghost button (white, shadow-border rgba(0,0,0,0.08) 0px 0px 0px 1px, 6px radius)."
- "Design a card: white background, no CSS border. Use shadow stack: rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px. Radius 8px. Title at 24px Geist weight 600, letter-spacing -0.96px. Body at 16px weight 400, #4d4d4d."
- "Build a pill badge: #ebf5ff background, #0068d6 text, 9999px radius, 0px 10px padding, 12px Geist weight 500."
- "Create navigation: white sticky header. Geist 14px weight 500 for links, #171717 text. Dark pill CTA 'Start Deploying' right-aligned. Shadow-border on bottom: rgba(0,0,0,0.08) 0px 0px 0px 1px."
- "Design a workflow section showing three steps: Develop (text color #0a72ef), Preview (#de1d8d), Ship (#ff5b4f). Each step: 14px Geist Mono uppercase label + 24px Geist weight 600 title + 16px weight 400 description in #4d4d4d."

### Iteration Guide
1. Always use shadow-as-border instead of CSS border — `0px 0px 0px 1px rgba(0,0,0,0.08)` is the foundation
2. Letter-spacing scales with font size: -2.4px at 48px, -1.28px at 32px, -0.96px at 24px, normal at 14px
3. Three weights only: 400 (read), 500 (interact), 600 (announce)
4. Color is functional, never decorative — workflow colors (Red/Pink/Blue) mark pipeline stages only
5. The inner `#fafafa` ring in card shadows is what gives Vercel cards their subtle inner glow
6. Geist Mono uppercase for technical labels, Geist Sans for everything else
