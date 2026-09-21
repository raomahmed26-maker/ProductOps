import { cn } from "@/lib/utils";
import { STATUS_CLASS, STATUS_DOT, STATUS_LABEL, type DerivedStatus } from "@/lib/status";

export function StatusPill({
  status,
  className,
  size = "default",
}: {
  status: DerivedStatus;
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        STATUS_CLASS[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
