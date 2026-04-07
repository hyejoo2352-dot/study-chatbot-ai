// textarea.tsx — 텍스트 입력 컴포넌트 (외부 라이브러리 없음)
import * as React from "react";

export function Textarea({ className = "", ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={`flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
