import { BlobCharacter } from "@/components/character/BlobCharacter";

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col items-center w-60 shrink-0 bg-white border-r border-gray-200 px-4 py-8 gap-4">
      <BlobCharacter state="idle" size={72} />
      <div className="text-center">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">Miri</h1>
        <p className="text-xs text-gray-400 mt-1">AI 학습 도우미</p>
      </div>
      <div className="mt-auto text-xs text-gray-300 text-center leading-relaxed">
        대화는 새로고침 시<br />초기화됩니다.
      </div>
    </aside>
  );
}
