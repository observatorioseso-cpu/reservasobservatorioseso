export default function CalendarioLoading() {
  return (
    <div className="min-h-[100dvh] bg-stone-950 animate-pulse">
      {/* Sticky header skeleton */}
      <div className="h-14 border-b border-stone-800 bg-stone-950 flex items-center px-4 gap-3">
        <div className="h-4 w-4 rounded bg-stone-800" />
        <div className="h-4 w-4 rounded bg-stone-800" />
        <div className="h-4 w-28 rounded bg-stone-800" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page title skeleton */}
        <div className="mb-8 space-y-2">
          <div className="h-8 w-64 rounded bg-stone-800" />
          <div className="h-4 w-80 rounded bg-stone-800" />
        </div>

        {/* Calendar header (month + nav) */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 rounded bg-stone-800" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded bg-stone-800" />
            <div className="h-8 w-8 rounded bg-stone-800" />
          </div>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-stone-800" />
          ))}
        </div>

        {/* Calendar grid — 5 rows × 7 cols */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-stone-900"
            />
          ))}
        </div>

        {/* Timeslot list skeleton */}
        <div className="mt-8 space-y-3">
          <div className="h-5 w-40 rounded bg-stone-800" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-stone-900" />
          ))}
        </div>
      </div>
    </div>
  )
}
