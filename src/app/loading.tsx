export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-5 py-8 lg:px-8 lg:py-10">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="mt-2 h-4 w-80 rounded bg-muted/70" />
      <div className="mt-8 h-36 rounded-xl border border-border bg-muted/40" />
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-40 rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-56 rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
