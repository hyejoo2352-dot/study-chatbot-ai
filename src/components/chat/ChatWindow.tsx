"use client";

// ============================================================
// components/chat/ChatWindow.tsx — 채팅 전체를 관리하는 컴포넌트
//
// 이 파일이 하는 일:
//   - 대화 내역(messages)을 state로 관리
//   - InputBar에서 메시지를 받으면 /api/chat에 전송
//   - AI 응답을 받아 messages에 추가
//   - 로딩/오류 상태를 BlobCharacter로 시각화
// ============================================================

import { useEffect, useRef, useState } from "react";
import type { CharacterState, Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { BlobCharacter } from "@/components/character/BlobCharacter";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 추가될 때마다 스크롤 하단으로 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 사용자가 메시지를 전송했을 때 호출됩니다
  const handleSend = async (userMessage: string) => {
    // 중복 클릭 방지
    if (isLoading) return;

    // 사용자 메시지를 즉시 화면에 표시
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);
    setCharacterState("thinking");

    try {
      // /api/chat으로 메시지와 대화 기록 전송
      // history는 사용자 메시지를 제외한 이전 대화 목록입니다
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages, // 이전 대화만 전송 (서버에서 MAX_HISTORY로 자름)
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok || data.error) {
        throw new Error(
          data.error ?? "현재 무료 한도 또는 API 사용 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요."
        );
      }

      // AI 응답을 대화 목록에 추가
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply! },
      ]);
      setCharacterState("idle");
    } catch (err) {
      const errorText =
        err instanceof Error
          ? err.message
          : "현재 무료 한도 또는 API 사용 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.";

      // 오류 메시지를 AI 응답 자리에 표시
      setMessages([
        ...newMessages,
        { role: "assistant", content: errorText },
      ]);
      setCharacterState("error");

      // 3초 후 캐릭터 상태 복구
      setTimeout(() => setCharacterState("idle"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <ScrollArea className="flex-1 px-4 pt-4">
        {/* 대화가 없을 때 캐릭터와 안내 문구 표시 */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <BlobCharacter state={characterState} size={72} />
            <p className="text-sm">안녕하세요! 오늘 할 일을 함께 확인해 볼까요?</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* AI가 응답 중일 때 로딩 표시 */}
        {isLoading && (
          <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm">
            <BlobCharacter state="thinking" size={28} />
            <span>생각하는 중...</span>
          </div>
        )}

        {/* 스크롤 앵커 */}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* 메시지 입력창 */}
      <InputBar isLoading={isLoading} onSend={handleSend} />
    </div>
  );
}
