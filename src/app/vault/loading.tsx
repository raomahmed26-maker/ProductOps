export default function Loading() {
  return (
    <div className="mx-auto max-w-[1100px] animate-pulse px-5 py-8 lg:px-8 lg:py-10">
      <div className="h-8 w-56 rounded-md bg-muted" />
      <div className="mt-2 h-4 w-full max-w-lg rounded bg-muted/70" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-6 rounded bg-muted/50" />
          ))}
        </div>
        <div>
          <div className="h-9 rounded-md bg-muted/60" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-40 rounded-xl border border-border bg-muted/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
