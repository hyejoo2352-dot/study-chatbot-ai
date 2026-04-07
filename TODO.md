# study-chatbot-ai — 구현 현황 & TODO

> **기술 스택 (실제 구현)**: Next.js 16.2.2 (App Router) · Gemini API (`@google/generative-ai`) · Tailwind CSS v4 · react-markdown  
> **배포**: Google Cloud Run (asia-northeast3) · 프로젝트 ID: `study-chatbot-ai-492606`

---

## 구현 완료 ✅

### 백엔드

- [x] `src/app/api/chat/route.ts` — POST /api/chat (Next.js Route Handler)
  - 빈 메시지 서버 차단
  - 최근 `MAX_HISTORY`개 대화만 전송 (비용 절감)
  - study-todo-app 할 일 목록 fetch 후 컨텍스트로 전달 (`TODO_APP_URL` 미설정 시 건너뜀)
  - 에러 발생 시 자동 재시도 없음
  - 콘솔에는 상세 에러, 화면에는 안내 문구만 노출
- [x] `src/lib/gemini.ts` — Gemini API 호출 로직
  - `GEMINI_API_KEY` 없으면 **mock mode** 자동 전환 (API 호출 0회)
  - `callAI(history, userMessage)` 시그니처 유지 → 다른 AI로 교체 시 이 파일만 수정
- [x] `src/lib/constants.ts` — 모델명·제한값·시스템프롬프트 상수 분리
  - `GEMINI_MODEL`, `MAX_HISTORY`, `MAX_OUTPUT_TOKENS`, `TEMPERATURE`, `SYSTEM_PROMPT`

### 프론트엔드

- [x] `src/components/chat/ChatWindow.tsx` — 대화 state 관리, fetch 호출
  - 페이지 진입 시 자동 API 호출 없음
  - 에러 시 자동 재시도 없음
- [x] `src/components/chat/InputBar.tsx` — 메시지 입력창
  - 빈 메시지 전송 불가 (버튼 disabled)
  - 로딩 중 버튼 비활성화 (중복 전송 방지)
  - Enter = 전송, Shift+Enter = 줄바꿈
- [x] `src/components/chat/MessageBubble.tsx` — 말풍선 (react-markdown)
- [x] `src/components/character/BlobCharacter.tsx` — CSS-only 캐릭터
- [x] `src/components/layout/ChatLayout.tsx`, `Sidebar.tsx`

### 설정

- [x] `src/types/index.ts` — 공통 타입
- [x] `src/app/globals.css` — Miri 컬러, `@keyframes float`, prose 스타일
- [x] `.env.local`, `.env.example` 작성
- [x] `next.config.ts` — `output: 'standalone'` 활성화
- [x] TypeScript 타입 체크 통과 (`npx tsc --noEmit`)
- [x] 프로덕션 빌드 통과 (`npm run build`)

---

## 과금 원칙 체크 ✅

| 원칙 | 위치 | 상태 |
|------|------|------|
| 페이지 진입 자동 호출 금지 | `ChatWindow.tsx` useEffect (scroll only) | ✅ |
| 전송 버튼 클릭 시 1회만 호출 | `handleSend` isLoading guard | ✅ |
| 빈 메시지 차단 | `InputBar` disabled + `route.ts` | ✅ |
| 중복 전송 방지 | `isLoading` + 버튼 disabled | ✅ |
| 에러 시 자동 재시도 없음 | catch → UI만 복구, refetch 없음 | ✅ |
| 최근 N개 대화만 전송 | `route.ts` `history.slice(-MAX_HISTORY)` | ✅ |
| 응답 길이 제한 | `MAX_OUTPUT_TOKENS = 256` | ✅ |
| API 키 없으면 mock | `gemini.ts` `isMockMode()` | ✅ |

---

## 배포 (Google Cloud Run)

### Phase 1. 배포 파일 준비

- [x] `Dockerfile` 작성 (Next.js standalone)
- [x] `.dockerignore` 작성
- [x] `next.config.ts` `output: 'standalone'` 활성화

### Phase 2. GCP 리소스 세팅

- [ ] GCP Secret Manager에 `GEMINI_API_KEY` 등록
  ```
  gcloud secrets create GEMINI_API_KEY --project study-chatbot-ai-492606
  echo -n "실제키" | gcloud secrets versions add GEMINI_API_KEY --data-file=- --project study-chatbot-ai-492606
  ```
- [ ] Artifact Registry 저장소 생성 (없는 경우)
  ```
  gcloud artifacts repositories create study-chatbot-ai \
    --repository-format=docker \
    --location=asia-northeast3 \
    --project study-chatbot-ai-492606
  ```

### Phase 3. 이미지 빌드 & 배포

- [ ] Docker 이미지 빌드 & 푸시
  ```
  docker build -t asia-northeast3-docker.pkg.dev/study-chatbot-ai-492606/study-chatbot-ai/app:latest .
  docker push asia-northeast3-docker.pkg.dev/study-chatbot-ai-492606/study-chatbot-ai/app:latest
  ```
- [ ] Cloud Run 배포
  ```
  gcloud run deploy study-chatbot-ai \
    --image asia-northeast3-docker.pkg.dev/study-chatbot-ai-492606/study-chatbot-ai/app:latest \
    --region asia-northeast3 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 2 \
    --memory 512Mi \
    --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
    --project study-chatbot-ai-492606
  ```

### Phase 4. (선택) todo 앱 연동

- [ ] study-todo-app도 Cloud Run에 배포 후 `TODO_APP_URL` 환경변수 추가
  ```
  gcloud run services update study-chatbot-ai \
    --set-env-vars TODO_APP_URL=https://todo앱URL \
    --region asia-northeast3 \
    --project study-chatbot-ai-492606
  ```

---

## 나중에 고려할 것 (현재 미구현, 기능상 문제 없음)

- [ ] SSE 스트리밍 (현재: 일반 JSON 응답 → 추후 필요시 전환)
- [ ] 세션 영속성 (현재: 새로고침 시 초기화 → 추후 MongoDB 추가 가능)
- [ ] 다크 모드
- [ ] 대화 내보내기
