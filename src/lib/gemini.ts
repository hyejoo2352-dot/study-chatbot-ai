// ============================================================
// gemini.ts — Gemini API 호출 로직
//
// 다른 AI 모델로 교체하고 싶다면 이 파일만 수정하면 됩니다.
// callAI 함수 시그니처(인자, 반환값)는 유지하고 내부만 바꾸세요.
//
// Mock mode 전환 방법:
//   - Real mode : .env.local에 GEMINI_API_KEY=실제키 설정
//   - Mock mode : GEMINI_API_KEY를 지우거나 비워두면 자동 전환
//                 실제 API 호출 없이 가짜 응답을 반환합니다.
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL, MAX_OUTPUT_TOKENS, SYSTEM_PROMPT, TEMPERATURE } from "./constants";
import type { Message } from "@/types";

// ─── Mock mode 판별 ──────────────────────────────────────────
// GEMINI_API_KEY가 없거나 플레이스홀더면 mock mode로 동작합니다.
// 실제 API를 전혀 호출하지 않으므로 과금이 발생하지 않습니다.
function isMockMode(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !key || key.trim() === "" || key.startsWith("여기에");
}

// ─── AI 호출 (mock 또는 real) ────────────────────────────────
/**
 * AI에게 메시지를 보내고 응답 텍스트를 반환합니다.
 *
 * - GEMINI_API_KEY 없음 → mock 응답 반환 (API 호출 없음)
 * - GEMINI_API_KEY 있음 → Gemini API 실제 호출
 *
 * 이 함수의 시그니처를 유지하면 route.ts를 건드리지 않고
 * 다른 AI(OpenAI, Ollama 등)로 교체할 수 있습니다.
 */
export async function callAI(history: Message[], userMessage: string): Promise<string> {
  // Mock mode: 키 없으면 가짜 응답 반환 (과금 0원)
  if (isMockMode()) {
    console.log("[callAI] Mock mode: GEMINI_API_KEY가 설정되지 않아 가짜 응답을 반환합니다.");
    return [
      "🧪 **Mock 모드로 동작 중입니다.**",
      "",
      "실제 AI 응답을 받으려면 `.env.local` 파일에 아래 내용을 추가하세요:",
      "```",
      "GEMINI_API_KEY=여기에_실제_키_입력",
      "```",
      "",
      `입력하신 메시지: _"${userMessage}"_`,
    ].join("\n");
  }

  // Real mode: Gemini API 호출 (1회, 재시도 없음)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    },
  });

  // 이전 대화를 Gemini 형식으로 변환
  // Gemini는 "user" / "model" 역할을 씁니다 (OpenAI의 "assistant" ≠ Gemini의 "model")
  const chat = model.startChat({
    history: history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}
