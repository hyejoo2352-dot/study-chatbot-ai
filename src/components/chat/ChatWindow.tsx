"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { BlobCharacter } from "@/components/character/BlobCharacter";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── TODO 미리보기 카드 (첫 화면 장식용) ─────────────────────
const TODO_PREVIEW = [
  {
    icon: "📌",
    label: "디자인 시스템 정리하기",
    time: "오늘 오전",
    status: "시작 전",
    statusClass: "bg-gray-100 text-gray-500",
  },
  {
    icon: "📧",
    label: "팀 주간 보고서 작성",
    time: "오늘 오후",
    status: "진행 중",
    statusClass: "bg-blue-50 text-blue-500",
  },
  {
    icon: "📚",
    label: "Next.js 문서 읽기",
    time: "오늘 저녁",
    status: "예정",
    statusClass: "bg-indigo-50 text-indigo-500",
  },
];

// ── 입력창 아래 suggestion chips ────────────────────────────
export const INPUT_CHIPS = [
  "오늘 할 일 추천해줘",
  "공부 계획 만들어줘",
  "우선순위 정리해줘",
  "루틴 만들어줘",
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

        {/* 빈 화면 → 첫 화면 대시보드 */}
        {isEmpty && (
          <div className="flex flex-col gap-6 w-full max-w-xl mx-auto pt-8 pb-4">

            {/* Hero — 수평 레이아웃 */}
            <div className="flex items-center gap-4">
              <div className="shrink-0 animate-float">
                <BlobCharacter state="idle" size={52} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">
                  안녕하세요, 저는 <span className="text-indigo-500">Miri</span>예요
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  오늘 할 일을 함께 정리해볼까요?
                </p>
              </div>
            </div>

            {/* TODO 미리보기 카드 3개 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-400 px-1">오늘의 할 일</p>
              {TODO_PREVIEW.map((todo) => (
                <div
                  key={todo.label}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <span className="text-xl shrink-0">{todo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{todo.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{todo.time}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${todo.statusClass}`}>
                    {todo.status}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA 버튼 */}
            <button
              onClick={() => handleSend("오늘 할 일 분석하고 우선순위 정리해줘")}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-150"
            >
              Miri와 오늘 하루 시작하기 →
            </button>

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
        showChips={isEmpty}
      />
    </div>
  );
}
