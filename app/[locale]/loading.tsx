export default function HomeLoading() {
  return (
    <div className="min-h-[100dvh] bg-stone-950 animate-pulse">
      {/* Nav skeleton */}
      <div className="h-16 bg-stone-900 border-b border-stone-800 flex items-center px-6 gap-4">
        <div className="h-5 w-32 rounded bg-stone-800" />
        <div className="flex-1" />
        <div className="h-5 w-16 rounded bg-stone-800" />
        <div className="h-5 w-16 rounded bg-stone-800" />
      </div>

      {/* Hero skeleton */}
      <div className="px-6 py-16 max-w-5xl mx-auto">
        <div className="h-4 w-24 rounded bg-stone-800 mb-4" />
        <div className="h-10 w-2/3 rounded bg-stone-800 mb-3" />
        <div className="h-6 w-1/2 rounded bg-stone-800 mb-10" />

        {/* Two observatory cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-stone-900 overflow-hidden">
            <div className="h-48 bg-stone-800" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-stone-800" />
              <div className="h-4 w-full rounded bg-stone-800" />
              <div className="h-4 w-5/6 rounded bg-stone-800" />
              <div className="h-10 w-full rounded-lg bg-stone-800 mt-4" />
            </div>
          </div>
          <div className="rounded-2xl bg-stone-900 overflow-hidden">
            <div className="h-48 bg-stone-800" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-stone-800" />
              <div className="h-4 w-full rounded bg-stone-800" />
              <div className="h-4 w-5/6 rounded bg-stone-800" />
              <div className="h-10 w-full rounded-lg bg-stone-800 mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
