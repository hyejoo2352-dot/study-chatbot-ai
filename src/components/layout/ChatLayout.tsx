import { Sidebar } from "./Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export function ChatLayout() {
  return (
    <div className="flex h-dvh bg-[#f5f3ff]">
      <Sidebar />
      <main className="flex flex-col flex-1 min-w-0">
        <ChatWindow />
      </main>
    </div>
  );
}
