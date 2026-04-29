import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] pl-20 md:pl-72 pr-4">
      <Sidebar />
      <main className="h-[100dvh] pt-4">
        <ChatInterface />
      </main>
    </div>
  );
}
