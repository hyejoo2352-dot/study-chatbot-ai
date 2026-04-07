// scroll-area.tsx — 스크롤 영역 컴포넌트 (외부 라이브러리 없음)
import * as React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ScrollArea({ className = "", children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={`overflow-y-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
