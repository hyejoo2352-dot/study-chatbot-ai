# Miri (미리) — AI Chat Assistant

> A lightweight AI chatbot built with Next.js, Hono, and Claude API.  
> Designed for PMs, UX/UI designers, and non-developers who are new to coding.

---

## Overview

Miri is a conversational AI assistant that explains technical concepts in a simple, step-by-step way. No login required — just visit and start chatting.

- **AI Model**: Claude Sonnet (claude-sonnet-4-5)
- **Session**: New conversation on every visit, history stored for 24 hours
- **Users**: Designed for ~5–10 concurrent users
- **Infra**: Google Cloud Run (Seoul region) + MongoDB Atlas

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Server | Hono (on Next.js Route Handler) |
| AI | Anthropic SDK — claude-sonnet-4-5, SSE streaming |
| Database | MongoDB Atlas M0 (Free), Mongoose, TTL 24h |
| Infra | Google Cloud Run, Artifact Registry, Secret Manager |
| Markdown | react-markdown, remark-gfm, rehype-highlight |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Chat page (sidebar + main)
│   ├── layout.tsx
│   └── api/
│       └── [[...route]]/
│           └── route.ts          # Hono entry point
├── lib/
│   ├── hono.ts                   # Hono app & router
│   ├── claude.ts                 # Anthropic SDK wrapper (streaming)
│   └── db/
│       ├── client.ts             # MongoDB singleton connection
│       └── models/
│           └── conversation.ts   # Mongoose schema + TTL index
└── components/
    ├── layout/
    │   ├── Sidebar.tsx
    │   └── ChatLayout.tsx
    ├── chat/
    │   ├── ChatWindow.tsx
    │   ├── MessageBubble.tsx     # Markdown rendering
    │   └── InputBar.tsx
    ├── character/
    │   └── BlobCharacter.tsx     # Gradient sphere character (CSS)
    └── ui/                       # shadcn/ui wrappers
```

---

## Getting Started (Local)

### Prerequisites

- Node.js 22+
- MongoDB Atlas account (or local MongoDB)
- Anthropic API key

### 1. Clone & Install

```bash
git clone https://github.com/your-org/miri.git
cd miri
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/miri
SYSTEM_PROMPT="You are Miri, a practical product design and beginner-friendly coding assistant..."
SESSION_COOKIE_SECRET=your-random-secret-here
NODE_ENV=development
CONTEXT_WINDOW_SIZE=10
```

> ⚠️ Never commit `.env.local` — it's already in `.gitignore`.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Send message → Claude SSE streaming response + MongoDB save |
| `GET` | `/api/session/new` | Issue new sessionId |
| `GET` | `/api/health` | Cloud Run health check + MongoDB status |

### POST /api/chat

**Request**
```json
{
  "sessionId": "uuid-v4",
  "message": "How do I use Git for the first time?"
}
```

**Response (SSE)**
```
data: {"delta":"Here's"}
data: {"delta":" how to get started..."}
data: [DONE]
```

---

## Data Model

```ts
// conversations collection
{
  sessionId: string,      // UUID v4 (cookie)
  messages: [
    {
      role: "user" | "assistant",
      content: string,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date         // TTL index base — auto-deleted 24h after last activity
}
```

TTL index:
```ts
ConversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 })
```

---

## Session Behavior

| Event | Behavior |
|---|---|
| First visit | New UUID issued, session cookie set (HttpOnly), MongoDB doc created |
| During chat | Messages saved to MongoDB after each exchange |
| Tab/browser closed | Session cookie cleared — new session on next visit |
| 24h after last message | MongoDB TTL auto-deletes the document |

**Context window**: last 10 turns sent to Claude API per request (configurable via `CONTEXT_WINDOW_SIZE`).

---

## Deployment (Google Cloud Run)

### Build & Push Docker Image

```bash
# Set your project variables
PROJECT_ID=your-gcp-project-id
REGION=asia-northeast3
IMAGE=gcr.io/$PROJECT_ID/miri

# Build
docker build -t $IMAGE .

# Push to Artifact Registry
docker push $IMAGE
```

### Deploy to Cloud Run

```bash
gcloud run deploy miri \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --cpu 1 \
  --memory 512Mi \
  --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
  --set-secrets MONGODB_URI=MONGODB_URI:latest \
  --set-secrets SYSTEM_PROMPT=SYSTEM_PROMPT:latest \
  --set-secrets SESSION_COOKIE_SECRET=SESSION_COOKIE_SECRET:latest \
  --set-env-vars NODE_ENV=production,CONTEXT_WINDOW_SIZE=10
```

### Cloud Run Service Settings

| Setting | Value | Reason |
|---|---|---|
| Min instances | 0 | Cost saving (cold start ~2–4s accepted) |
| Max instances | 2 | Sufficient for 5–10 users |
| CPU | 1 vCPU | — |
| Memory | 512Mi | Next.js minimum |
| Region | asia-northeast3 | Low latency (Seoul) |
| Auth | Allow unauthenticated | Public service |

---

## Environment Variables

| Variable | Storage | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Secret Manager | Claude API key |
| `MONGODB_URI` | Secret Manager | Atlas connection string |
| `SYSTEM_PROMPT` | Secret Manager | Miri's role & personality |
| `SESSION_COOKIE_SECRET` | Secret Manager | Cookie signing secret |
| `NODE_ENV` | Plain env | production / development |
| `CONTEXT_WINDOW_SIZE` | Plain env | Context turns (default: 10) |

---

## Cost Estimate (Monthly)

| Item | Cost | Note |
|---|---|---|
| Cloud Run | $0–$2 | Min instances 0, low traffic |
| MongoDB Atlas M0 | $0 | Free tier |
| Artifact Registry | ~$0.10 | 1–2 images |
| Secret Manager | ~$0.06 | 4 secrets |
| Claude API | Usage-based | $3/MTok input · $15/MTok output |
| **Total (excl. Claude)** | **< $2/mo** | |

---

## Design Reference

**Character — Miri**  
A gradient sphere with two small white pill-shaped eyes. Gradient: purple → indigo → sky blue.  
States: default (eyes open, float animation) · thinking (eyes closed) · error (furrowed brows).

**Color Palette**

| Name | Hex | Usage |
|---|---|---|
| Indigo | `#6366f1` | Primary, user bubble |
| Violet | `#a78bfa` | Character gradient mid |
| Sky | `#38bdf8` | Character gradient end |
| Fuchsia | `#e879f9` | Thinking state |
| Rose | `#fda4af` | Accent |
| Background | `#f5f3ff` | Page background |
| Dark | `#1e1b4b` | Dark mode base |

**Layout**: Sidebar (240px) + Main chat area. Mobile: sidebar becomes overlay drawer.  
**Typography**: Serif for headings, system sans-serif for body.  
**Markdown**: Full rendering — bold, italic, code blocks, tables, lists.

---

## License

MIT
