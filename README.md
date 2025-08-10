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

## Step 1 — Content Safety Agent (finished test task)

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
  - Tool `guardTool` exposes `inputSchema` and `outputSchema` and calls `guardAgent`.
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
