"use server";

export type ChatActionState = {
  error?: string;
  sessionId?: string;
  message?: string;
};

export async function submitChat(
  prevState: ChatActionState,
  formData: FormData
): Promise<ChatActionState> {
  const sessionId = formData.get("sessionId");
  const message = formData.get("message");

  if (!message || typeof message !== "string" || message.trim() === "") {
    return { error: "메시지를 입력해주세요." };
  }

  if (!sessionId || typeof sessionId !== "string") {
    return { error: "세션이 유효하지 않습니다. 페이지를 새로고침해주세요." };
  }

  // 검증 통과 → 클라이언트에서 SSE fetch 실행하도록 값 반환
  return { sessionId, message: message.trim() };
}
