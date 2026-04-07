// ============================================================
// types/index.ts — 앱 전체에서 공유하는 타입 정의
// ============================================================

export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export type CharacterState = "idle" | "thinking" | "error";
