"use client";

import { type Dispatch, type SetStateAction, useRef } from "react";
import { INPUT_CHIPS } from "./ChatWindow";

interface InputBarProps {
  isLoading: boolean;
  onSend: (message: string) => void;
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  showChips?: boolean;
}

export function InputBar({ isLoading, onSend, value, onChange, showChips }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !isLoading && value.trim().length > 0;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    onChange("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="shrink-0 px-4 md:px-8 py-4 bg-white border-t border-gray-100">
      {/* 입력 컨테이너 */}
      <div
        className={`flex items-end gap-3 bg-gray-50 rounded-2xl border transition-colors px-4 py-3
          ${isLoading ? "border-gray-200" : "border-gray-200 focus-within:border-indigo-300 focus-within:bg-white"}`}
      >
        {/* 텍스트 영역 */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="예: 오늘 할 일 정리해줘"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-h-[24px] max-h-[160px] overflow-y-auto leading-relaxed disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />

        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
            ${canSend
              ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm hover:shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          aria-label="전송"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* 제안 칩 */}
      {showChips && (
        <div className="flex flex-wrap gap-2 mt-3">
          {INPUT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSend(chip)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 도움말 텍스트 */}
      <p className="text-[11px] text-gray-400 mt-2 px-1">
        Enter로 전송 · Shift+Enter로 줄바꿈
      </p>
    </div>
  );
}
