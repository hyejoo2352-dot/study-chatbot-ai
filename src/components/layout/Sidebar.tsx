"use client";

import { BlobCharacter } from "@/components/character/BlobCharacter";

const NAV_ITEMS = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: "AI 채팅",
    active: true,
    badge: null,
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    label: "TODO 플래너",
    active: false,
    badge: "곧 출시",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "스마트 제안",
    active: false,
    badge: "곧 출시",
  },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-gray-100 h-full">
      {/* 앱 로고 */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 shrink-0">
          <BlobCharacter state="idle" size={32} />
        </div>
        <div>
          <h1 className="text-base font-bold text-indigo-600 leading-none tracking-tight">Miri</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">AI 생산성 어시스턴트</p>
        </div>
      </div>

      {/* 새 대화 버튼 */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 대화
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 pt-4 overflow-y-auto">
        <p className="text-xs font-medium text-gray-400 px-2 mb-2">기능</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                  ${item.active
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-gray-400 opacity-40 cursor-not-allowed"
                  }`}
              >
                <span className={item.active ? "text-indigo-500" : "text-gray-400"}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* 구분선 */}
        <div className="my-4 border-t border-gray-100" />

        {/* 사용 팁 카드 */}
        <div className="mx-1 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-1">💡 팁</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            할 일 앱과 연동하면 오늘의 TODO를 AI가 자동으로 분석해드려요.
          </p>
        </div>
      </nav>

      {/* 하단 정보 */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-300 leading-relaxed">
          대화는 새로고침 시 초기화됩니다.
        </p>
      </div>
    </aside>
  );
}
