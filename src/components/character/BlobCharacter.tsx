import { CharacterState } from "@/types";

interface BlobCharacterProps {
  state?: CharacterState;
  size?: number;
}

export function BlobCharacter({ state = "idle", size = 80 }: BlobCharacterProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      {/* 구체 본체 */}
      <div
        style={{ width: size, height: size }}
        className={`
          rounded-full shadow-lg
          ${state === "error"
            ? "bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500"
            : "bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-400"}
          ${state === "thinking" ? "animate-pulse" : "animate-float"}
        `}
      />

      {/* 눈 */}
      <div className="absolute inset-0 flex items-center justify-center gap-[18%] pt-[10%]">
        {state === "idle" && (
          <>
            <div className="w-[12%] h-[18%] bg-white rounded-full" />
            <div className="w-[12%] h-[18%] bg-white rounded-full" />
          </>
        )}
        {state === "thinking" && (
          <>
            <div className="w-[12%] h-[5%] bg-white rounded-full" />
            <div className="w-[12%] h-[5%] bg-white rounded-full" />
          </>
        )}
        {state === "error" && (
          <>
            {/* 찡그린 눈: 기울어진 선 */}
            <div className="w-[14%] h-[5%] bg-white rounded-full -rotate-12" />
            <div className="w-[14%] h-[5%] bg-white rounded-full rotate-12" />
          </>
        )}
      </div>

    </div>
  );
}
