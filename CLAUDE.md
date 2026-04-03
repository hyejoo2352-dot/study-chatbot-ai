S# CLAUDE.md — Miri Project Guide

This file tells Claude Code how to understand and work with this codebase.

---

## Project Overview

**Miri (미리)** is an AI chat assistant built for PMs, UX/UI designers, and non-developers learning to code. It uses Next.js 15 with Hono for server-side routing, MongoDB Atlas for 24h session storage, and the Anthropic Claude API (claude-sonnet-4-5) with SSE streaming.

No separate backend. All server logic lives inside Next.js App Router + Hono Route Handler.

---

## Key Architectural Decisions

### Why Hono on top of Next.js?

Hono runs inside `app/api/[[...route]]/route.ts`. It gives us proper middleware, request validation, and clean routing without spinning up a separate Express/Fastify server. All server logic is self-contained in the Next.js container.

### Why MongoDB for session storage (not in-memory)?

Storing sessions in a Node.js `Map` would break when Cloud Run scales to multiple instances — users would lose context mid-conversation. MongoDB Atlas (free tier) externalizes state so any instance can serve any request.

### Why 24h TTL on `updatedAt` (not `createdAt`)?

TTL based on `updatedAt` means a document is only deleted 24 hours _after the last message_ — not 24 hours after the session started. This prevents an active conversation from being deleted mid-session.

### Why SSE (not WebSocket)?

Next.js Route Handlers natively support streaming responses via `ReadableStream`. SSE is simpler to implement, works over HTTP/1.1, and is sufficient for one-way AI response streaming.

---

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build production
npm run build

# Start production server
npm start

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Environment Variables

Required in `.env.local` for local development:

```env
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...
SYSTEM_PROMPT=...
SESSION_COOKIE_SECRET=...
NODE_ENV=development
CONTEXT_WINDOW_SIZE=10
```

In production, all secrets are mounted from Google Cloud Secret Manager via Cloud Run `--set-secrets` flags.

---

## File Guide

### `src/app/api/[[...route]]/route.ts`

Hono entry point. Exports `GET` and `POST` handlers that delegate to the Hono app defined in `lib/hono.ts`.

```ts
import { handle } from "hono/vercel";
import app from "@/lib/hono";
export const GET = handle(app);
export const POST = handle(app);
```

### `src/lib/hono.ts`

Defines all API routes:

- `POST /api/chat` — validates body, loads session from MongoDB, calls Claude with context, streams response, saves to DB
- `GET /api/session/new` — generates UUID v4, returns sessionId
- `GET /api/health` — returns `{ ok: true, db: "connected" }`

### `src/lib/claude.ts`

Thin wrapper around `@anthropic-ai/sdk`. Handles:

- Building the messages array (system prompt + last N turns from session)
- Calling `client.messages.stream()`
- Returning an async iterator of delta strings

### `src/lib/db/client.ts`

MongoDB singleton pattern for Next.js (prevents multiple connections in dev due to hot reload):

```ts
// Caches the connection on `global` to survive hot reloads
let cached = global.mongoose ?? { conn: null, promise: null };
```

### `src/lib/db/models/conversation.ts`

Mongoose schema with TTL index. Key points:

- `updatedAt` must be manually updated on every message save (`{ new: true }`)
- TTL index: `{ updatedAt: 1 }, { expireAfterSeconds: 86400 }`

### `src/components/character/BlobCharacter.tsx`

CSS-only gradient sphere. Props:

- `state`: `'idle' | 'thinking' | 'error'`
- `size`: number (px)

Implemented with `border-radius: 50%` and `radial-gradient`. Float animation via `@keyframes`. No canvas, no SVG, no external library.

### `src/components/chat/MessageBubble.tsx`

Renders a single message. Uses `react-markdown` with `remark-gfm` and `rehype-highlight` plugins. User messages: right-aligned indigo bubble. Assistant messages: left-aligned white/gray bubble with full markdown.

### `src/components/chat/InputBar.tsx`

Textarea that auto-grows. Enter = submit, Shift+Enter = newline. Disabled during streaming. Uses `dvh` units for mobile keyboard compatibility.

---

## Data Flow: Single Chat Request

```
1. User types message → InputBar fires POST /api/chat
2. Hono validates { sessionId, message }
3. Load conversation from MongoDB by sessionId
4. Build context: system prompt + last 10 turns from DB
5. Call Anthropic SDK stream()
6. Stream SSE deltas back to browser as they arrive
7. On stream complete: save user message + full AI response to MongoDB
8. Update updatedAt → resets 24h TTL clock
```

---

## Miri's Personality (System Prompt)

Miri is a practical product design and beginner-friendly coding assistant.

Target users: PMs, UX/UI designers, non-developers new to coding.

Rules Miri follows:

- Break down answers into clear steps
- Avoid jargon unless explained
- Prioritize practical execution over theory
- For tools (Git, VS Code, CLI): provide exact commands and where to run them
- Proactively clarify commonly confusing things
- If unsure, say so and suggest a safe next step

Tone: direct, clear, slightly instructional. Format: step-by-step guides, short sections, minimal fluff.

---

## Deployment

Deployed on Google Cloud Run (asia-northeast3, Seoul).

```bash
# Build image
docker build -t gcr.io/PROJECT_ID/miri .

# Push
docker push gcr.io/PROJECT_ID/miri

# Deploy
gcloud run deploy miri \
  --image gcr.io/PROJECT_ID/miri \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --memory 512Mi \
  --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
  --set-secrets MONGODB_URI=MONGODB_URI:latest \
  --set-secrets SYSTEM_PROMPT=SYSTEM_PROMPT:latest \
  --set-secrets SESSION_COOKIE_SECRET=SESSION_COOKIE_SECRET:latest
```

`next.config.ts` must have `output: 'standalone'` for the Dockerfile to work.

---

## Common Mistakes to Avoid

| Mistake                                          | Why it breaks                               | Fix                                      |
| ------------------------------------------------ | ------------------------------------------- | ---------------------------------------- |
| Multiple MongoDB connections                     | Hot reload creates new connection each time | Use the singleton in `lib/db/client.ts`  |
| Saving AI response before stream ends            | Partial responses saved to DB               | Only save after `[DONE]` received        |
| TTL index on `createdAt`                         | Active sessions deleted mid-conversation    | Use `updatedAt`, reset on every message  |
| Max instances > 1 without external session store | Users lose context across instances         | Already solved — MongoDB stores sessions |
| Forgetting `output: 'standalone'` in next.config | Docker build produces incorrect artifacts   | Always set before building image         |

---

## Out of Scope (Current Version)

- User authentication / login
- Multiple concurrent conversations per user
- Conversation history UI (past sessions)
- Admin dashboard
- Rate limiting (may add per-session request cap later)
- Dark mode (TBD)
- Voice input (referenced in design but not implemented)
