import { cn } from "@/lib/utils";
import { GATES, GATE_SPEC, type Gate } from "@/lib/taxonomy";

type StageLike = { gate: string; status: string };

/** The eight gates as a compact rail, so position in the process reads at a glance. */
export function GateRail({
  stages,
  currentGate,
  className,
  showLabels = false,
}: {
  stages: StageLike[];
  currentGate: Gate;
  className?: string;
  showLabels?: boolean;
}) {
  const byGate = new Map(stages.map((stage) => [stage.gate, stage.status]));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {GATES.map((gate) => {
        const status = byGate.get(gate) ?? "NOT_STARTED";
        const isCurrent = gate === currentGate;
        return (
          <div key={gate} className="group/gate relative flex-1" title={GATE_SPEC[gate].label}>
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                status === "COMPLETE" && "bg-foreground/75",
                status === "IN_PROGRESS" && "bg-sky-500",
                status === "BLOCKED" && "bg-rose-500",
                status === "NOT_STARTED" && "bg-border",
                isCurrent && "ring-2 ring-offset-1 ring-offset-card",
                isCurrent && status === "BLOCKED" && "ring-rose-500/40",
                isCurrent && status !== "BLOCKED" && "ring-sky-500/35",
              )}
            />
            {showLabels ? (
              <p
                className={cn(
                  "mt-1.5 truncate text-[10px]",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {GATE_SPEC[gate].short}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
