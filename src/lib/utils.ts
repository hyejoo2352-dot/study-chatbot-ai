// utils.ts — 공통 유틸리티 함수
// className을 조합하는 간단한 함수 (clsx/tailwind-merge 대체)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
