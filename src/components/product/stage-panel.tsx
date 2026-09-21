import { AlertCircle, Check, CircleDashed, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOC_TYPE_LABEL, GATE_SPEC, STAGE_STATUS_LABEL, type Gate, type StageStatus } from "@/lib/taxonomy";
import { gateChecklist } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { DocumentRegistry, type DocumentRow } from "./document-registry";
import { StageControls } from "./stage-controls";

export type StageData = {
  id: string;
  gate: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  expectedDays: number;
  owner: string | null;
  blockedReason: string | null;
  notes: string | null;
  documents: DocumentRow[];
};

const STATUS_CLASS: Record<StageStatus, string> = {
  NOT_STARTED: "border-border bg-muted text-muted-foreground",
  IN_PROGRESS: "border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  BLOCKED: "border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  COMPLETE: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
};

export function StagePanel({
  stage,
  isCurrent,
  children,
}: {
  stage: StageData;
  isCurrent: boolean;
  children?: React.ReactNode;
}) {
  const gate = stage.gate as Gate;
  const spec = GATE_SPEC[gate];
  const checklist = gateChecklist(gate, stage.documents);
  const satisfied = checklist.filter((item) => item.approved).length;

  return (
    <section
      className={cn(
        "rounded-xl border bg-card",
        isCurrent ? "border-foreground/25" : "border-border",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold tracking-tight">{spec.label}</h3>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                STATUS_CLASS[stage.status as StageStatus],
              )}
            >
              {STAGE_STATUS_LABEL[stage.status as StageStatus]}
            </span>
            {isCurrent ? (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                current gate
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{spec.intent}</p>
        </div>

        <div className="text-right text-[11px] text-muted-foreground">
          {stage.owner ? <p className="font-medium text-foreground">{stage.owner}</p> : null}
          <p>
            {stage.completedAt
              ? `Completed ${formatDate(stage.completedAt)}`
              : stage.startedAt
                ? // Live is ongoing, so an expected duration would be nonsense.
                  `Started ${formatDate(stage.startedAt)}${gate === "LIVE" ? "" : ` · ${stage.expectedDays}d expected`}`
                : `${stage.expectedDays}d expected`}
          </p>
        </div>
      </header>

      {stage.blockedReason ? (
        <div className="flex items-start gap-2 border-b border-border bg-rose-500/8 px-5 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
          <p className="text-xs text-rose-700 dark:text-rose-300">{stage.blockedReason}</p>
        </div>
      ) : null}

      <div className="space-y-5 px-5 py-4">
        {checklist.length > 0 ? (
          <div>
            <div className="flex items-baseline justify-between">
              <h4 className="text-xs font-semibold tracking-tight">Gate checklist</h4>
              <span className="numeric text-[11px] text-muted-foreground">
                {satisfied} of {checklist.length} approved
              </span>
            </div>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {checklist.map((item) => (
                <li key={item.docType} className="flex items-center gap-2 text-xs">
                  {item.approved ? (
                    <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : item.present ? (
                    <CircleDashed className="size-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <Minus className="size-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      item.approved
                        ? "text-foreground"
                        : item.present
                          ? "text-muted-foreground"
                          : "text-muted-foreground/70",
                    )}
                  >
                    {DOC_TYPE_LABEL[item.docType as keyof typeof DOC_TYPE_LABEL]}
                    {item.present && !item.approved ? " — awaiting sign-off" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {stage.notes ? (
          <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {stage.notes}
          </p>
        ) : null}

        <DocumentRegistry stageId={stage.id} gate={gate} documents={stage.documents} />

        {children}

        <StageControls stage={stage} />
      </div>
    </section>
  );
}
