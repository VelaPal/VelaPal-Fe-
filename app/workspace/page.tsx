import OverviewContent from "@/features/overview/components/overview-content";

export default function OverviewPage() {
  const isMock = process.env.NEXT_PUBLIC_API_MODE === "mock";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-slate-500">
            YOUR PERSONAL WORKSPACE
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Your overview
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Keep track of your spending, subscriptions, and decisions
            that need your attention.
          </p>
        </div>

        {isMock && (
          <span className="w-fit shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            Demo data
          </span>
        )}
      </header>

      <OverviewContent />
    </div>
  );
}