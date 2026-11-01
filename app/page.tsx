import Sidebar from "@/components/layout/sidebar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1B293D]">
      <Sidebar />

      <main className="px-5 pb-10 pt-24 sm:px-8 lg:ml-64 lg:pt-10">
        <p className="text-xs font-medium tracking-widest text-slate-500">
          YOUR PERSONAL WORKSPACE
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Good evening, Daffa.
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          A clearer view of your money. A little less to worry about.
        </p>
      </main>
    </div>
  );
}