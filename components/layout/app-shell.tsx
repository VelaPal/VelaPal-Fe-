import type { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1B293D]">
      <Sidebar />

      <main className="min-h-screen px-5 pb-10 pt-24 sm:px-8 lg:ml-64 lg:pt-10">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}