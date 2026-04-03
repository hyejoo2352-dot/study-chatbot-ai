export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
  createdAt?: Date;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export type CharacterState = "idle" | "thinking" | "error";
