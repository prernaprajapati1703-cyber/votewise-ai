
# VoteSmart AI — Port to Lovable

Rebuild the existing Express + React VoteSmart AI app on Lovable's stack (TanStack Start), keeping all 5 backend capabilities (Chat, Guide, Mythbuster, Quiz, Improve Prompt) and adding a polished, India-election-themed UI.

## What we'll build

### Pages / routes
- `/` — Landing with hero ("Make every vote informed"), feature cards, CTA into the tools.
- `/chat` — Ask AI election questions (bilingual EN/HI explanations).
- `/guide` — Step-by-step voting guide selector: First-time Voter, Student, Elderly (+ NRI, Senior Citizen, Persons with Disabilities).
- `/myth` — Myth-buster: enter a claim, get TRUE/FALSE verdict + reasoning.
- `/quiz` — 5-question MCQ quiz on Indian elections, scoring at the end, "New quiz" button.
- `/improve` — Prompt polisher.
- Shared header with nav (Link-based, active state) and footer.

### Backend (server functions, not Express)
Five `createServerFn` handlers that call OpenAI directly using your `OPENAI_API_KEY`:
- `chatAsk(message)` — election educator system prompt, EN + HI output.
- `getGuide(userType)` — structured step-by-step guide with documents and Do's/Don'ts.
- `checkMyth(statement)` — fact-check verdict + explanation.
- `generateQuiz()` — returns JSON array of `{question, options[], answer, explanation}` using OpenAI tool-calling for reliable structured output (more robust than `JSON.parse` on raw text).
- `improvePrompt(userPrompt)` — prompt-engineering rewrite.

All five wrap a single helper that calls `https://api.openai.com/v1/chat/completions` with `gpt-3.5-turbo` (configurable). API key read from `process.env.OPENAI_API_KEY` inside handlers — never exposed to the browser.

### UX polish (redesign)
- Indian-election theme: saffron / white / green accent palette layered over a clean neutral background, navy headings.
- Typography: large display headings, comfortable reading width, proper line-height.
- Components from existing shadcn/ui kit: Card, Button, Tabs, Input, Textarea, Badge, Skeleton, Sonner toasts.
- Markdown rendering for AI responses (`react-markdown`) so bilingual / step-by-step output looks clean.
- Loading skeletons instead of plain "Analyzing…" text.
- Error toasts on API failure (401 = bad key, 429 = rate limit, network error).
- Quiz: progress bar, one question at a time, instant feedback per answer, final score screen.
- Mobile-first responsive layout (you're on a 393px viewport).
- Subtle motion: fade-in on response, tab transitions.

### Secrets
You'll be prompted to add `OPENAI_API_KEY` once. It's stored securely and only readable from server functions.

## Technical notes
- Stack: TanStack Start file-based routing under `src/routes/`, server logic via `createServerFn` in `src/server/openai.functions.ts` + `src/server/openai.server.ts`.
- No Express, no `axios`, no `cors` — same-origin server functions remove the need for any of that.
- Quiz uses OpenAI function-calling with a Zod-validated schema so we never crash on malformed JSON.
- New deps: `react-markdown`, `zod` (likely already present), `openai` SDK (or plain `fetch` — leaning plain fetch to keep the bundle lean and Worker-compatible).
- Each route gets its own `head()` metadata for SEO / sharing.

## Out of scope (ask later if you want them)
- Saving chat history / quiz scores (would need Lovable Cloud + auth).
- Voice input, multi-language beyond EN+HI in the prompt.
- Polling-station / EPIC lookup integrations.
