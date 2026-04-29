import Sidebar from "@/components/Sidebar";
import RealtimeDashboard from "@/components/RealtimeDashboard";

export default function RealtimePage() {
  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] pl-20 md:pl-72 pr-4 py-8">
      <Sidebar />
      <main className="max-w-6xl mx-auto">
        <RealtimeDashboard />
      </main>
    </div>
  );
}
