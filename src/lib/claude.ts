import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ?? "You are Miri, a helpful assistant.";
const CONTEXT_WINDOW_SIZE = parseInt(process.env.CONTEXT_WINDOW_SIZE ?? "10", 10);

export async function* streamClaude(
  history: Message[],
  userMessage: string
): AsyncGenerator<string> {
  // 최근 N턴만 컨텍스트로 사용
  const recentHistory = history.slice(-CONTEXT_WINDOW_SIZE);

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const stream = client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
