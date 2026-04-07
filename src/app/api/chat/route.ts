// ============================================================
// app/api/chat/route.ts — 채팅 API 서버 라우트
//
// POST /api/chat
//   요청: { message: string, history: Message[] }
//   응답: { reply: string } 또는 { error: string }
//
// 과금 원칙:
//   - 사용자가 전송 버튼을 눌렀을 때만 1회 호출
//   - 오류 발생 시 자동 재시도 없음
//   - 빈 메시지는 API 호출 전에 차단
//   - 대화 기록은 MAX_HISTORY개만 전송
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/gemini";
import { MAX_HISTORY } from "@/lib/constants";
import type { Message } from "@/types";

// 사용자에게 보여줄 에러 문구 (원인 구분 없이 동일하게 표시)
const USER_ERROR_MSG =
  "현재 무료 한도 또는 API 사용 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { message?: string; history?: Message[] };
    const { message, history = [] } = body;

    // 1. 빈 메시지 차단 — API 호출 전에 처리 (과금 방지)
    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    }

    // 2. 최근 N개 대화만 전송 (비용 절감)
    const trimmedHistory = history.slice(-MAX_HISTORY);

    // 3. 할 일 목록 가져오기
    //    TODO_APP_URL이 없거나 앱이 꺼져 있으면 조용히 건너뜁니다.
    //    이 fetch는 AI 호출과 무관하게 실패해도 채팅은 정상 동작합니다.
    let todoContext = "";
    const todoAppUrl = process.env.TODO_APP_URL;

    if (todoAppUrl) {
      try {
        const res = await fetch(`${todoAppUrl}/api/tasks`, {
          cache: "no-store",
          signal: AbortSignal.timeout(2000), // 2초 초과 시 건너뜀
        });
        if (res.ok) {
          const tasks = (await res.json()) as Array<{
            title: string;
            section: string;
            done: boolean;
          }>;
          if (tasks.length > 0) {
            const lines = tasks
              .map((t) => `- [${t.done ? "x" : " "}] ${t.section === "morning" ? "☀️" : "🌙"} ${t.title}`)
              .join("\n");
            todoContext = `\n\n[현재 할 일 목록]\n${lines}`;
          }
        }
      } catch {
        // todo 앱이 꺼져 있어도 에러 없이 진행
      }
    }

    // 4. Gemini(또는 mock) 호출 — 1회, 재시도 없음
    const messageWithContext = todoContext
      ? `${message.trim()}${todoContext}`
      : message.trim();

    const reply = await callAI(trimmedHistory, messageWithContext);
    return NextResponse.json({ reply });

  } catch (error) {
    // 5. 에러 처리
    //    - 콘솔: 개발자용 원인 상세 로그
    //    - 응답: 사용자에게는 단순 안내만 (원인 구분 없음)
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[/api/chat]", detail);

    return NextResponse.json({ error: USER_ERROR_MSG }, { status: 500 });
  }
}
