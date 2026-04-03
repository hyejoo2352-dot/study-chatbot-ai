# Miri — 구현 TODO

> 기술 스택: Next.js 15 (App Router) · Hono · Anthropic SDK · MongoDB + Mongoose · Tailwind CSS v4 · shadcn/ui  
> 배포: Google Cloud Run (asia-northeast3)

---

## Phase 1. 프로젝트 초기 세팅

### 1-1. Next.js 프로젝트 생성

- [ ] `npx create-next-app@latest miri` 실행
  - ✅ TypeScript
  - ✅ Tailwind CSS
  - ✅ App Router
  - ✅ `src/` 디렉토리 사용
  - ❌ ESLint (선택 사항)
  - ❌ Turbopack (안정성 위해 기본 webpack 사용)

### 1-2. 디렉터리 구조 생성

```
src/
├── app/
│   ├── actions.ts              ← Server Actions ('use server')
│   ├── api/
│   │   └── [[...route]]/       ← Hono 진입점
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── character/
│   ├── chat/
│   ├── layout/
│   └── ui/                     ← shadcn/ui 자동 생성
├── lib/
│   ├── db/
│   │   ├── client.ts
│   │   └── models/
│   ├── hono.ts
│   └── claude.ts
└── types/
    └── index.ts                ← 공통 타입 정의
```

- [ ] `src/components/character/` 폴더 생성
- [ ] `src/components/chat/` 폴더 생성
- [ ] `src/components/layout/` 폴더 생성
- [ ] `src/lib/db/models/` 폴더 생성
- [ ] `src/types/` 폴더 생성

### 1-3. 패키지 설치

**Runtime dependencies**
```bash
npm install hono @hono/node-server
npm install @anthropic-ai/sdk
npm install mongoose
npm install uuid
npm install react-markdown remark-gfm rehype-highlight
```

**UI dependencies**
```bash
npx shadcn@latest init
npx shadcn@latest add button textarea scroll-area
```

**Dev dependencies**
```bash
npm install -D @types/uuid @types/node
```

### 1-4. 환경변수 설정

- [ ] `.env.local` 파일 생성
  ```env
  ANTHROPIC_API_KEY=sk-ant-...
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/miri
  SYSTEM_PROMPT="You are Miri..."
  SESSION_COOKIE_SECRET=your-random-secret-here
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  NODE_ENV=development
  CONTEXT_WINDOW_SIZE=10
  ```
- [ ] `.env.example` 파일 생성 (값은 비워두고 키만 명시)
- [ ] `.gitignore` 에 `.env.local` 포함 확인

### 1-5. Next.js 설정

- [ ] `next.config.ts` 에 `output: 'standalone'` 추가
  ```ts
  const nextConfig = {
    output: 'standalone',
  };
  export default nextConfig;
  ```

---

## Phase 2. DB 레이어 (MongoDB + Mongoose)

- [ ] `src/lib/db/client.ts` — MongoDB 싱글턴 연결
  ```ts
  // dev 환경에서 hot-reload 시 중복 연결 방지
  // global 객체에 연결을 캐싱
  ```
- [ ] `src/lib/db/models/conversation.ts` — Mongoose 스키마
  - 필드: `sessionId` (string), `messages[]` (`role`, `content`, `createdAt`), `createdAt`, `updatedAt`
  - TTL 인덱스: `{ updatedAt: 1 }, { expireAfterSeconds: 86400 }` (24시간)
  - `updatedAt` 은 메시지 저장 시마다 수동 업데이트

---

## Phase 3. Server Action 정의

> **왜 Server Action과 SSE를 분리하는가?**  
> Next.js Server Action은 폼 제출 후 단일 응답을 반환합니다. SSE 스트리밍은 지원하지 않으므로,  
> **입력 검증·에러 처리는 Server Action**, **AI 응답 스트리밍은 Hono SSE 엔드포인트**가 담당합니다.

- [ ] `src/app/actions.ts` — Server Action 파일
  ```ts
  'use server'

  export type ChatActionState = {
    error?: string
    sessionId?: string
  }

  export async function submitChat(
    prevState: ChatActionState,
    formData: FormData
  ): Promise<ChatActionState> {
    const sessionId = formData.get('sessionId')
    const message = formData.get('message')

    // 입력 검증
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return { error: '메시지를 입력해주세요.' }
    }
    if (!sessionId || typeof sessionId !== 'string') {
      return { error: '세션이 유효하지 않습니다.' }
    }

    // 검증 통과 → 클라이언트에서 SSE fetch를 실행하도록 sessionId 반환
    return { sessionId }
  }
  ```

---

## Phase 4. 공통 타입 정의

- [ ] `src/types/index.ts`
  ```ts
  export type Role = 'user' | 'assistant';

  export interface Message {
    role: Role;
    content: string;
    createdAt?: Date;
  }

  export interface ChatRequest {
    sessionId: string;
    message: string;
  }
  ```

---

## Phase 5. 서버 레이어 (Hono + Anthropic SDK)

### 5-1. Claude SDK 래퍼

- [ ] `src/lib/claude.ts`
  - Anthropic 클라이언트 초기화
  - 메시지 배열 구성: 시스템 프롬프트 + DB에서 불러온 최근 N턴
  - `client.messages.stream()` 호출
  - delta 문자열 yield (async generator)

### 5-2. Hono 라우터

- [ ] `src/lib/hono.ts`
  - `GET /api/session/new` — UUID v4 발급, JSON 반환
  - `POST /api/chat` — 순서:
    1. 요청 본문 검증 (`sessionId`, `message`)
    2. MongoDB에서 세션 로드 (없으면 새 문서 생성)
    3. Claude SDK 스트림 시작
    4. SSE 형식으로 delta 청크 전송
    5. 스트림 완료 후 → MongoDB에 user + assistant 메시지 저장, `updatedAt` 갱신
  - `GET /api/health` — DB 연결 상태 확인 후 `{ ok: true, db: "connected" }` 반환

### 5-3. Route Handler 연결

- [ ] `src/app/api/[[...route]]/route.ts`
  ```ts
  import { handle } from 'hono/vercel';
  import app from '@/lib/hono';
  export const GET = handle(app);
  export const POST = handle(app);
  ```

---

## Phase 6. 프론트엔드 컴포넌트

### 6-1. BlobCharacter (캐릭터)

- [ ] `src/components/character/BlobCharacter.tsx`
  - CSS-only 구현 (캔버스, SVG, 외부 라이브러리 사용 안 함)
  - `border-radius: 50%` + `radial-gradient` (purple → indigo → sky blue)
  - props: `state: 'idle' | 'thinking' | 'error'`, `size?: number`
  - `@keyframes` float 애니메이션
  - state별 눈 표현: idle(열린 눈), thinking(감은 눈), error(찡그린 눈)

### 5-2. 채팅 컴포넌트

- [ ] `src/components/chat/MessageBubble.tsx`
  - user 메시지: 오른쪽 정렬, 인디고(`#6366f1`) 배경
  - assistant 메시지: 왼쪽 정렬, 흰색/회색 배경 + `react-markdown` 렌더링
  - `remark-gfm` (표, 취소선 등), `rehype-highlight` (코드 블록 하이라이팅) 적용

- [ ] `src/components/chat/InputBar.tsx` — **`useActionState` 패턴 적용**
  ```tsx
  'use client'

  import { useActionState, useEffect, useRef } from 'react'
  import { submitChat, type ChatActionState } from '@/app/actions'

  const initialState: ChatActionState = {}

  export function InputBar({ onStream }: { onStream: (sessionId: string, msg: string) => void }) {
    const [state, formAction, pending] = useActionState(submitChat, initialState)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Server Action 검증 통과 시 → SSE fetch 실행
    useEffect(() => {
      if (state.sessionId && !state.error) {
        const message = textareaRef.current?.value ?? ''
        onStream(state.sessionId, message)
        if (textareaRef.current) textareaRef.current.value = ''
      }
    }, [state])

    return (
      <form action={formAction}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <textarea
          ref={textareaRef}
          name="message"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          // Enter → 전송, Shift+Enter → 줄바꿈
        />
        {state.error && <p role="alert">{state.error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? '전송 중...' : '전송'}
        </button>
      </form>
    )
  }
  ```
  - `useActionState`: 폼 상태·에러·pending 관리 (React 19 공식 방식)
  - `pending`: 버튼 disabled + 스트리밍 중 비활성화
  - `state.error`: 서버 검증 에러 메시지 표시
  - 모바일 키보드 대응: `height: 100dvh`

- [ ] `src/components/chat/ChatWindow.tsx`
  - 메시지 목록 렌더링 (MessageBubble 사용)
  - 새 메시지 도착 시 자동 스크롤 하단 고정
  - 페이지 마운트 시 `GET /api/session/new` 호출 → sessionId 상태 저장
  - `onStream` 콜백: Server Action 검증 통과 후 SSE fetch 실행
    ```
    fetch('/api/chat') → ReadableStream → TextDecoder → delta 누적 → 화면 업데이트
    ```
  - BlobCharacter state 연동: 전송 중 `thinking`, 완료 후 `idle`

### 5-3. 레이아웃 컴포넌트

- [ ] `src/components/layout/Sidebar.tsx`
  - 고정 너비 240px
  - BlobCharacter + "Miri" 앱 이름 표시
  - 모바일: overlay drawer (shadcn Sheet 컴포넌트 활용)

- [ ] `src/components/layout/ChatLayout.tsx`
  - Sidebar + 메인 채팅 영역 조합
  - 반응형: 모바일에서 사이드바 숨김 → 햄버거 버튼으로 열기

---

## Phase 6. 페이지 & 전역 스타일

- [ ] `src/app/layout.tsx`
  - 글로벌 메타데이터 설정 (title, description)
  - 폰트: heading은 serif, body는 system sans-serif
- [ ] `src/app/page.tsx`
  - `<ChatLayout>` 렌더링
  - 페이지 배경색: `#f5f3ff`

- [ ] `tailwind.config` or `globals.css` — 컬러 팔레트 확장

  | 토큰 | Hex | 용도 |
  |---|---|---|
  | `--color-indigo` | `#6366f1` | Primary, 사용자 버블 |
  | `--color-violet` | `#a78bfa` | 캐릭터 그라디언트 중간 |
  | `--color-sky` | `#38bdf8` | 캐릭터 그라디언트 끝 |
  | `--color-fuchsia` | `#e879f9` | thinking 상태 |
  | `--color-rose` | `#fda4af` | 강조 |
  | `--color-bg` | `#f5f3ff` | 페이지 배경 |
  | `--color-dark` | `#1e1b4b` | 다크 베이스 |

---

## Phase 7. 로컬 검증

- [ ] `npm run dev` 실행 후 `http://localhost:3000` 접속 확인
- [ ] 전체 흐름 수동 테스트
  1. 첫 방문 → sessionId 발급 확인 (DevTools > Network)
  2. 메시지 전송 → SSE delta 스트리밍 수신 확인
  3. MongoDB Atlas에서 `conversations` 컬렉션에 저장 확인
  4. 탭 닫고 재방문 → 새 sessionId 발급 확인
  5. `GET /api/health` → `{ ok: true }` 확인
- [ ] TypeScript 타입 체크: `npx tsc --noEmit`
- [ ] Lint 통과: `npm run lint`

---

## Phase 8. 배포 (Google Cloud Run)

- [ ] `Dockerfile` 작성 (Next.js standalone 출력 기반)
- [ ] `.dockerignore` 작성 (`node_modules`, `.env*`, `.git` 등)
- [ ] GCP 사전 준비
  - Artifact Registry 저장소 생성
  - Secret Manager에 4개 시크릿 등록:
    `ANTHROPIC_API_KEY` / `MONGODB_URI` / `SYSTEM_PROMPT` / `SESSION_COOKIE_SECRET`
- [ ] Docker 이미지 빌드 & 푸시
  ```bash
  docker build -t gcr.io/PROJECT_ID/miri .
  docker push gcr.io/PROJECT_ID/miri
  ```
- [ ] Cloud Run 배포
  ```bash
  gcloud run deploy miri \
    --image gcr.io/PROJECT_ID/miri \
    --region asia-northeast3 \
    --allow-unauthenticated \
    --min-instances 0 --max-instances 2 \
    --memory 512Mi \
    --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
    --set-secrets MONGODB_URI=MONGODB_URI:latest \
    --set-secrets SYSTEM_PROMPT=SYSTEM_PROMPT:latest \
    --set-secrets SESSION_COOKIE_SECRET=SESSION_COOKIE_SECRET:latest \
    --set-env-vars NODE_ENV=production,CONTEXT_WINDOW_SIZE=10
  ```
- [ ] 배포 완료 후 Cloud Run URL에서 `/api/health` 확인
- [ ] MongoDB Atlas IP allowlist에 `0.0.0.0/0` 추가 (또는 Cloud Run 고정 IP 설정)

---

## 진행 순서 요약

```
[1. 세팅] → [2. DB] → [3. 타입] → [4. API] → [5~6. UI/페이지] → [7. 검증] → [8. 배포]
```

> - Phase 1–4: 순서대로 진행 (각 단계가 다음 단계의 기반)
> - Phase 5–6: 병렬 작업 가능
> - Phase 7–8: 5–6 완료 후 진행
