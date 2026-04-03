# Miri — 구현 TODO

> 기술 스택: Next.js 15 (App Router) · Hono · Anthropic SDK · MongoDB + Mongoose · Tailwind CSS v4 · shadcn/ui  
> 배포: Google Cloud Run (asia-northeast3)

---

## Phase 1. 프로젝트 초기 세팅

### 1-1. Next.js 프로젝트 생성

- [x] `npx create-next-app@latest` 실행 (Next.js 16.2.2, React 19.2.4)
  - ✅ TypeScript
  - ✅ Tailwind CSS v4
  - ✅ App Router
  - ✅ `src/` 디렉토리 사용

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

- [x] `src/components/character/` 폴더 생성
- [x] `src/components/chat/` 폴더 생성
- [x] `src/components/layout/` 폴더 생성
- [x] `src/lib/db/models/` 폴더 생성
- [x] `src/types/` 폴더 생성

### 1-3. 패키지 설치

**Runtime dependencies**
- [x] `hono`, `@anthropic-ai/sdk`, `mongoose`, `uuid`, `react-markdown`, `remark-gfm`, `rehype-highlight`

**UI dependencies**
- [x] `shadcn/ui` 초기화 + `button`, `textarea`, `scroll-area` 컴포넌트 추가

**Dev dependencies**
- [x] `@types/uuid`

### 1-4. 환경변수 설정

- [x] `.env.local` 파일 생성
- [x] `.env.example` 파일 생성 (값은 비워두고 키만 명시)
- [x] `.gitignore` 에 `.env*` 포함 확인

### 1-5. Next.js 설정

- [x] `next.config.ts` 에 `output: 'standalone'` 추가

---

## Phase 2. DB 레이어 (MongoDB + Mongoose)

- [x] `src/lib/db/client.ts` — MongoDB 싱글턴 연결
  - `global.mongoose` 캐싱으로 dev hot-reload 중복 연결 방지
- [x] `src/lib/db/models/conversation.ts` — Mongoose 스키마
  - 필드: `sessionId`, `messages[]` (`role`, `content`, `createdAt`), `createdAt`, `updatedAt`
  - TTL 인덱스: `{ updatedAt: 1 }, { expireAfterSeconds: 86400 }` (24시간)
  - `updatedAt` 은 메시지 저장 시마다 수동 업데이트

---

## Phase 3. Server Action 정의

> **왜 Server Action과 SSE를 분리하는가?**  
> Next.js Server Action은 폼 제출 후 단일 응답을 반환합니다. SSE 스트리밍은 지원하지 않으므로,  
> **입력 검증·에러 처리는 Server Action**, **AI 응답 스트리밍은 Hono SSE 엔드포인트**가 담당합니다.

- [x] `src/app/actions.ts` — Server Action 파일 (`'use server'`)
  - `submitChat(prevState, formData)` — sessionId·message 검증 후 값 반환

---

## Phase 4. 공통 타입 정의

- [x] `src/types/index.ts`
  - `Role`, `Message`, `ChatRequest`, `CharacterState` 타입

---

## Phase 5. 서버 레이어 (Hono + Anthropic SDK)

### 5-1. Claude SDK 래퍼

- [x] `src/lib/claude.ts`
  - Anthropic 클라이언트 초기화
  - 메시지 배열 구성: 시스템 프롬프트 + DB에서 불러온 최근 N턴
  - `client.messages.stream()` 호출, delta async generator 반환

### 5-2. Hono 라우터

- [x] `src/lib/hono.ts`
  - `GET /api/session/new` — UUID v4 발급
  - `POST /api/chat` — 검증 → MongoDB 로드 → Claude 스트림 → SSE → DB 저장
  - `GET /api/health` — DB 연결 상태 확인

### 5-3. Route Handler 연결

- [x] `src/app/api/[[...route]]/route.ts` — Hono를 Next.js에 연결

---

## Phase 6. 프론트엔드 컴포넌트

### 6-1. BlobCharacter (캐릭터)

- [x] `src/components/character/BlobCharacter.tsx`
  - CSS-only 구현 (gradient sphere, float 애니메이션)
  - `state: 'idle' | 'thinking' | 'error'` 별 눈 표현

### 6-2. 채팅 컴포넌트

- [x] `src/components/chat/MessageBubble.tsx`
  - user/assistant 말풍선, react-markdown + remark-gfm + rehype-highlight
- [x] `src/components/chat/InputBar.tsx`
  - `useActionState` 패턴 (React 19 공식), pending/error 처리
  - Enter 전송, Shift+Enter 줄바꿈, 자동 높이 조절
- [x] `src/components/chat/ChatWindow.tsx`
  - 세션 발급, SSE 스트리밍 수신, 자동 스크롤, BlobCharacter 연동

### 6-3. 레이아웃 컴포넌트

- [x] `src/components/layout/Sidebar.tsx` — 240px 사이드바, 모바일 숨김
- [x] `src/components/layout/ChatLayout.tsx` — Sidebar + ChatWindow 조합

---

## Phase 7. 페이지 & 전역 스타일

- [x] `src/app/layout.tsx` — 메타데이터(한국어), 폰트 설정
- [x] `src/app/page.tsx` — `<ChatLayout />` 렌더링
- [x] `src/app/globals.css` — Miri 컬러 팔레트, prose 스타일

---

## Phase 8. 검증

- [x] TypeScript 타입 체크: `npx tsc --noEmit` — 에러 없음
- [x] 빌드 확인: `npm run build` — 성공
- [ ] 로컬 실행 후 전체 흐름 수동 테스트 (`.env.local` 실제 값 입력 후)
  1. 첫 방문 → sessionId 발급 확인
  2. 메시지 전송 → SSE 스트리밍 수신 확인
  3. MongoDB에서 `conversations` 컬렉션 저장 확인
  4. `GET /api/health` 응답 확인

---

## Phase 9. 배포 (Google Cloud Run)

- [ ] `Dockerfile` 작성 (Next.js standalone 기반)
- [ ] `.dockerignore` 작성
- [ ] GCP Secret Manager에 시크릿 4개 등록
- [ ] Docker 이미지 빌드 & Artifact Registry 푸시
- [ ] Cloud Run 배포 (asia-northeast3, 512Mi, min 0 / max 2)
- [ ] MongoDB Atlas IP allowlist 설정

---

## 진행 순서 요약

```
[1. 세팅✅] → [2. DB✅] → [3. Action✅] → [4. 타입✅] → [5. API✅] → [6. UI✅] → [7. 페이지✅] → [8. 검증✅] → [9. 배포]
```
