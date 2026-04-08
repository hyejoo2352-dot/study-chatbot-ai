"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { BlobCharacter } from "@/components/character/BlobCharacter";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── 첫 화면 제안 칩 ──────────────────────────────────────────
const INITIAL_SUGGESTIONS = [
  { emoji: "☀️", label: "오늘 할 일 추천해줘", sub: "오늘 하루 계획 세우기" },
  { emoji: "📚", label: "공부 계획 만들어줘", sub: "효율적인 학습 루틴" },
  { emoji: "🎯", label: "우선순위 정리해줘", sub: "중요한 것부터 처리" },
  { emoji: "🔁", label: "루틴 만들어줘", sub: "반복 가능한 습관 설계" },
];

// ── AI 응답 후 후속 제안 칩 ───────────────────────────────────
const FOLLOW_UP_SUGGESTIONS = [
  "더 자세히 설명해줘",
  "다음 단계는 뭐야?",
  "다른 방법도 알려줘",
  "오늘 할 일도 확인해줘",
];

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (userMessage: string) => {
    if (isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok || data.error) {
        throw new Error(
          data.error ?? "현재 무료 한도 또는 API 사용 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요."
        );
      }

      setMessages([...newMessages, { role: "assistant", content: data.reply! }]);
    } catch (err) {
      const errorText =
        err instanceof Error
          ? err.message
          : "현재 무료 한도 또는 API 사용 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.";

      setMessages([...newMessages, { role: "assistant", content: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (label: string) => {
    handleSend(label);
  };

  const isEmpty = messages.length === 0;
  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";
  const showFollowUp = !isLoading && lastIsAssistant;

  return (
    <div className="flex flex-col h-full bg-[#f8f7ff]">
      {/* ── 메시지 영역 ────────────────────────────────────────── */}
      <ScrollArea className="flex-1 px-4 md:px-8 py-6">

        {/* 빈 화면 → 온보딩 히어로 */}
        {isEmpty && (
          <div className="flex flex-col items-center pt-6 pb-4 text-center">
            {/* 캐릭터 */}
            <div className="mb-4 animate-float">
              <BlobCharacter state="idle" size={80} />
            </div>

            {/* 인사 */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              안녕하세요! 저는 <span className="text-indigo-500">Miri</span>예요 👋
            </h2>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">
              할 일 정리, 공부 계획, 루틴 만들기까지 —<br />
              오늘 무엇부터 시작할까요?
            </p>

            {/* 제안 카드 2×2 그리드 */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {INITIAL_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleChipClick(s.label)}
                  className="group flex flex-col items-start gap-1.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 hover:bg-indigo-50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-150 text-left"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 leading-snug">
                    {s.label}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-indigo-400">
                    {s.sub}
                  </span>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* 메시지 목록 */}
        <div className="space-y-1">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
        </div>

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex items-center gap-2.5 mt-4 mb-2 px-1">
            <div className="w-7 h-7 shrink-0">
              <BlobCharacter state="thinking" size={28} />
            </div>
            <div className="flex items-center gap-1.5 bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* AI 응답 후 후속 제안 칩 (지속적 넛징) */}
        {showFollowUp && (
          <div className="mt-4 mb-2">
            <p className="text-xs text-gray-400 mb-2 px-1">이렇게 이어가 보세요</p>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UP_SUGGESTIONS.map((label) => (
                <button
                  key={label}
                  onClick={() => handleChipClick(label)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      {/* ── 입력창 ────────────────────────────────────────────── */}
      <InputBar
        isLoading={isLoading}
        onSend={handleSend}
        value={inputValue}
        onChange={setInputValue}
      />
    </div>
  );
}
