import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/db/client";
import { Conversation } from "@/lib/db/models/conversation";
import { streamClaude } from "@/lib/claude";

const app = new Hono().basePath("/api");

// GET /api/session/new — 새 세션 ID 발급
app.get("/session/new", (c) => {
  const sessionId = uuidv4();
  return c.json({ sessionId });
});

// GET /api/health — DB 연결 상태 확인
app.get("/health", async (c) => {
  try {
    await connectDB();
    return c.json({ ok: true, db: "connected" });
  } catch {
    return c.json({ ok: false, db: "disconnected" }, 500);
  }
});

// POST /api/chat — 메시지 수신 → Claude 스트림 → SSE 응답
app.post("/chat", async (c) => {
  const body = await c.req.json<{ sessionId?: string; message?: string }>();
  const { sessionId, message } = body;

  if (!sessionId || !message || message.trim() === "") {
    return c.json({ error: "sessionId와 message가 필요합니다." }, 400);
  }

  await connectDB();

  // 세션 로드 또는 신규 생성
  let conversation = await Conversation.findOne({ sessionId });
  if (!conversation) {
    conversation = new Conversation({ sessionId, messages: [] });
    await conversation.save();
  }

  const history = conversation.messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // SSE 스트리밍 응답
  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = "";

        try {
          for await (const delta of streamClaude(history, message.trim())) {
            fullResponse += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
            );
          }

          // 스트림 완료 후 DB 저장
          conversation!.messages.push(
            { role: "user", content: message.trim(), createdAt: new Date() },
            { role: "assistant", content: fullResponse, createdAt: new Date() }
          );
          conversation!.updatedAt = new Date();
          await conversation!.save();

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("Claude stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "스트리밍 오류가 발생했습니다." })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
});

export default app;
