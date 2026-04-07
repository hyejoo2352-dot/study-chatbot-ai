"use client";

// ============================================================
// components/chat/InputBar.tsx — 메시지 입력창 컴포넌트
//
// 이 파일이 하는 일:
//   - 텍스트 입력 및 전송 처리
//   - Enter = 전송, Shift+Enter = 줄바꿈
//   - 빈 메시지 차단, 전송 중 중복 클릭 방지
//   - 전송 중 버튼 비활성화 및 로딩 표시
// ============================================================

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface InputBarProps {
  isLoading: boolean;
  onSend: (message: string) => void;
}

export function InputBar({ isLoading, onSend }: InputBarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const disabled = isLoading || !value.trim();

  const handleSubmit = () => {
    const trimmed = value.trim();
    // 빈 메시지 차단
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setValue("");

    // 전송 후 textarea 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-200 bg-white">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        onInput={(e) => {
          // textarea 높이 자동 조절
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
      />

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
        className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white h-[44px] px-5"
      >
        {isLoading ? "전송 중..." : "전송"}
      </Button>
    </div>
  );
}
