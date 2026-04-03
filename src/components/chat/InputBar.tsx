"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitChat, type ChatActionState } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialState: ChatActionState = {};

interface InputBarProps {
  sessionId: string;
  isStreaming: boolean;
  onStream: (sessionId: string, message: string) => void;
}

export function InputBar({ sessionId, isStreaming, onStream }: InputBarProps) {
  const [state, formAction, pending] = useActionState(submitChat, initialState);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Server Action 검증 통과 시 → 부모의 SSE fetch 실행
  useEffect(() => {
    if (state.sessionId && state.message && !state.error) {
      onStream(state.sessionId, state.message);
      if (textareaRef.current) textareaRef.current.value = "";
    }
  }, [state]);

  const disabled = pending || isStreaming;

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2 p-4 border-t border-gray-200 bg-white">
      {/* sessionId를 hidden input으로 전달 */}
      <input type="hidden" name="sessionId" value={sessionId} />

      <Textarea
        ref={textareaRef}
        name="message"
        placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled) formRef.current?.requestSubmit();
          }
        }}
        onInput={(e) => {
          // 자동 높이 조절
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
      />

      <Button
        type="submit"
        disabled={disabled}
        className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white h-[44px] px-5"
      >
        {pending || isStreaming ? "전송 중..." : "전송"}
      </Button>

      {state.error && (
        <p role="alert" className="absolute bottom-16 left-4 text-xs text-rose-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
