# Study Chatbot AI

할 일 목록(study-todo-app)을 함께 확인하는 Gemini 기반 AI 챗봇입니다.

---

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. `.env.local` 파일 만들기

프로젝트 루트에 `.env.local` 파일을 만들고 아래 내용을 붙여넣으세요.

```env
# [필수] Gemini API 키
GEMINI_API_KEY=여기에_실제_키_입력

# [선택] study-todo-app 주소 (할 일 연동 시)
TODO_APP_URL=http://localhost:3000
```

**Gemini API 키 발급 방법:**

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. `Create API key` 클릭
3. 발급된 키를 `GEMINI_API_KEY=` 뒤에 붙여넣기

> 무료 플랜으로도 충분히 사용할 수 있습니다. 신용카드 등록 불필요.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## study-todo-app 연동 방법

할 일 앱과 이 챗봇을 함께 쓰고 싶다면:

1. `study-todo-app` 터미널에서 실행 (기본 포트 3000)
2. 이 챗봇은 다른 포트로 실행

```bash
# study-todo-app 실행 (포트 3000)
cd ../study-todo-app && npm run dev

# 이 챗봇 실행 (포트 3001)
npm run dev -- -p 3001
```

3. `.env.local`에 `TODO_APP_URL=http://localhost:3000` 설정 확인

이제 챗봇에게 "오늘 할 일 알려줘"라고 물어보면 할 일 목록을 참고해서 답합니다.

---

## 파일 구조

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # Gemini 호출 서버 라우트 (AI 연결 포인트)
│   ├── layout.tsx             # 앱 전체 레이아웃
│   └── page.tsx               # 메인 페이지
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx     # 채팅 전체 관리 (대화 상태, API 호출)
│   │   ├── InputBar.tsx       # 메시지 입력창
│   │   └── MessageBubble.tsx  # 개별 말풍선
│   ├── character/
│   │   └── BlobCharacter.tsx  # AI 상태 캐릭터 (idle/thinking/error)
│   └── layout/
│       ├── ChatLayout.tsx     # 사이드바 + 채팅창 레이아웃
│       └── Sidebar.tsx        # 왼쪽 사이드바
├── lib/
│   ├── constants.ts           # ★ 모델명·제한값 설정 (여기서 모델 교체)
│   └── gemini.ts              # ★ Gemini API 호출 로직 (모델 교체 시 여기 수정)
└── types/
    └── index.ts               # 공통 타입 정의
```

---

## 자주 수정하는 부분 (쉬운 순서)

### 1. AI 응답 성격/말투 바꾸기 → `src/lib/constants.ts`

```ts
export const SYSTEM_PROMPT = `당신은 ... (여기를 원하는 대로 수정)`;
```

### 2. 모델 교체하기 → `src/lib/constants.ts`

```ts
export const GEMINI_MODEL = "gemini-2.0-flash-lite"; // 여기만 바꾸면 됩니다
```

사용 가능한 무료 모델:
- `"gemini-2.0-flash-lite"` — 가장 빠르고 저렴 (기본값)
- `"gemini-1.5-flash"` — 더 긴 응답
- `"gemini-1.5-flash-8b"` — 가장 가벼움

### 3. 응답 길이/대화 기억 수 조정 → `src/lib/constants.ts`

```ts
export const MAX_HISTORY = 6;        // 서버로 보낼 이전 대화 수
export const MAX_OUTPUT_TOKENS = 512; // AI 응답 최대 길이
```

### 4. AI 로직 전체 교체 → `src/lib/gemini.ts`

`callAI` 함수의 내부만 바꾸면 다른 AI로 교체할 수 있습니다.

---

## 오류 대처

| 증상 | 원인 | 해결 |
|------|------|------|
| "무료 한도 또는 API 사용 제한" | API 키 미설정 또는 한도 초과 | `.env.local` 키 확인, 잠시 후 재시도 |
| 할 일 목록이 AI에게 안 보임 | study-todo-app 미실행 | todo 앱 먼저 실행 후 챗봇 재시작 |
| 포트 충돌 | 3000번 포트 이미 사용 중 | `npm run dev -- -p 3001`로 실행 |
