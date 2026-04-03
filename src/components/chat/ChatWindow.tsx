"use client";

import { useEffect, useRef, useState } from "react";
import { Message, CharacterState } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { BlobCharacter } from "@/components/character/BlobCharacter";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatWindow() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  // 페이지 마운트 시 새 세션 발급
  useEffect(() => {
    fetch("/api/session/new")
      .then((r) => r.json())
      .then((data) => setSessionId(data.sessionId))
      .catch(() => setCharacterState("error"));
  }, []);

  // 새 메시지마다 스크롤 하단 고정
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SSE 스트리밍 처리
  const handleStream = async (sid: string, userMessage: string) => {
    // 사용자 메시지 즉시 표시
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);
    setCharacterState("thinking");

    // 스트리밍 중 assistant 메시지 자리 확보
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, message: userMessage }),
      });

      if (!res.ok || !res.body) throw new Error("응답 오류");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;

          const parsed = JSON.parse(raw) as { delta?: string; error?: string };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.delta) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + parsed.delta,
              };
              return updated;
            });
          }
        }
      }

      setCharacterState("idle");
    } catch (err) {
      console.error(err);
      setCharacterState("error");
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant" && updated[updated.length - 1].content === "") {
          updated[updated.length - 1] = {
            role: "assistant",
            content: "오류가 발생했습니다. 다시 시도해주세요.",
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <ScrollArea className="flex-1 px-4 pt-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <BlobCharacter state={characterState} size={72} />
            <p className="text-sm">안녕하세요! 무엇이든 물어보세요.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* 입력 바 */}
      {sessionId && (
        <InputBar
          sessionId={sessionId}
          isStreaming={isStreaming}
          onStream={handleStream}
        />
      )}
    </div>
  );
}
