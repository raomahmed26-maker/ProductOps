export default function Loading() {
  return (
    <div className="mx-auto max-w-[1100px] animate-pulse px-5 py-8 lg:px-8 lg:py-10">
      <div className="h-4 w-24 rounded bg-muted/70" />
      <div className="mt-4 h-8 w-56 rounded-md bg-muted" />
      <div className="mt-2 h-4 w-96 max-w-full rounded bg-muted/70" />
      <div className="mt-6 h-32 rounded-xl border border-border bg-muted/40" />
      <div className="mt-6 h-9 w-full max-w-lg rounded-md bg-muted/60" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-64 rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
