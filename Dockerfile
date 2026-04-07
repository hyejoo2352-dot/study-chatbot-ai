# ============================================================
# Dockerfile — Next.js standalone 빌드 기반
#
# 빌드 방법:
#   docker build -t <이미지명> .
#
# 실행 방법:
#   docker run -p 3000:3000 -e GEMINI_API_KEY=실제키 <이미지명>
# ============================================================

# ── 1단계: 의존성 설치 ──────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── 2단계: 빌드 ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# 빌드 시 환경변수 불필요 (API 키는 런타임에 주입)
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── 3단계: 실행 이미지 (최소 크기) ───────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Cloud Run은 8080 포트를 기본으로 사용합니다
EXPOSE 8080

# standalone 빌드 결과물만 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# non-root 실행 (보안)
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && chown -R nextjs:nodejs /app

USER nextjs

CMD ["node", "server.js"]
