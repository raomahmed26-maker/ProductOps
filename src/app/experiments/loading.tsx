export default function Loading() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse px-5 py-8 lg:px-8 lg:py-10">
      <div className="h-8 w-64 rounded-md bg-muted" />
      <div className="mt-2 h-4 w-full max-w-xl rounded bg-muted/70" />
      <div className="mt-6 h-20 rounded-xl border border-border bg-muted/40" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-52 rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
