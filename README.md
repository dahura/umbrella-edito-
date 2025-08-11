This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# umbrella-edito-

---

## Step 1 — Content Safety Agent (finished Sabrina's test task)

This step introduces a content safety classifier agent built with AI SDK v5 and OpenRouter. The agent takes input text and returns either:

- `{"status":"safe","categories":[]}`
- `{"status":"unsafe","categories":["<one or more categories>"]}`

Supported categories (English):

- Hate speech
- Violence
- Sexual content
- Spam
- Harassment and bullying
- Self-harm or suicide encouragement
- Illegal activities
- Misinformation / fake news
- Terrorism-related content
- Hate symbols and extremist content

### Implementation

- Agent: `app/agent/text-guard-agent.ts`

  - Uses `generateObject` with a strict Zod schema to enforce structured output.

- API route: `app/api/guard/route.ts`
  - `POST /api/guard` accepts `{ text: string }` and returns `{ status, categories }`.
- Test samples: `test-data/guard/*.txt`
  - Contains representative texts for all supported categories and a safe example.
- Node test runner: `scripts/test-guard.js`
  - Posts `.txt` file contents to the API and prints JSON responses.

### Prerequisites

- Set your OpenRouter API key (for example via `.env.local`):

```bash
echo "OPENROUTER_API_KEY=YOUR_KEY" >> .env.local
```

### Run the dev server

```bash
npm run dev
```

### Test via API (manual)

```bash
curl -s -X POST http://localhost:3000/api/guard \
  -H 'Content-Type: application/json' \
  --data '{"text":"Your text here"}'
```

### Test all sample files

```bash
npm run test:guard
```

### Test specific files

```bash
node scripts/test-guard.js test-data/guard/spam.txt test-data/guard/hate-speech.txt
```

### Customize

Environment variables for the runner:

- `BASE_URL` (default: `http://localhost:3000`)
- `ENDPOINT` (default: `/api/guard`)
- `DATA_DIR` (default: `test-data/guard`)

Example:

```bash
BASE_URL=http://localhost:3001 npm run test:guard
```

---

## Step 2 — Editor with Content Guard (merged with shadcn-editor extension)

This step consolidates the product demo and the extension work into a single deliverable: a modern editor with built‑in Content Guard, plus a path to reuse the same feature set in my shadcn-based editor.

**Product Features:**

- Custom Lexical-based editor with:
  - Rich-text formatting (bold, italic, underline, quote)
  - Math support (inline `$...$` and block `$$...$$`, KaTeX rendering)
  - Markdown import/export
  - Content Guard: real-time safety status indicator and a floating analysis widget that highlights issues

**How it works:**

- As users type, the editor automatically analyzes the content for safety using the `/api/guard` agent endpoint.
- Detected issues (e.g., hate speech, violence, sexual content, spam) are shown in a draggable widget with clear descriptions and color-coded warnings.
- The toolbar displays the current safety status and allows users to toggle the analyzer widget.

**Motivation and extension plan:**

- I chose to go beyond the initial scope and integrate the same Guard experience into my shadcn-based editor to showcase a realistic product direction.
- Repository: https://github.com/dahura/shadcn-editor
- Integration goal: add the same Guard API (`POST /api/guard`) and UI signals (toolbar button + floating widget) so users get instant safety feedback in the shadcn editor.
- Status mapping: Hate speech, Violence, Sexual content, Spam (extendable)

Implementation outline (both here and for shadcn-editor):

1. Guard client util that calls `POST /api/guard` with `{ text }` and returns `{ status, categories }`.
2. Toolbar Content Guard button that reflects status and toggles the analyzer.
3. Draggable analyzer widget that lists detected categories with short descriptions and colors.
4. Debounced analysis on content change.

Key implementation files (this repo):

- `lib/lexical/feature/text-analyzer.tsx`
- `lib/lexical/feature/text-analyzer-widget.tsx`
- `components/markdown-editor.tsx`

> Note: I completed the first task via the agent within ~2 hours and then implemented this merged step to present a cohesive product story.

---
