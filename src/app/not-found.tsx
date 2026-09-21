import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
      <div className="text-center">
        <p className="font-mono text-xs text-muted-foreground">404</p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight">Nothing here</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That product, experiment or note does not exist — or it was renamed and the link went
          stale.
        </p>
        <ButtonLink href="/" className="mt-5" size="sm">
          Back to the portfolio
        </ButtonLink>
      </div>
    </div>
  );
}
