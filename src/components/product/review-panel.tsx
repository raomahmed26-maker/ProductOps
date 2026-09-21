"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, NativeSelect } from "@/components/forms/field";
import { saveSubmission } from "@/lib/actions";
import {
  PLATFORMS,
  PLATFORM_LABEL,
  REJECTION_REASONS,
  REJECTION_REASON_LABEL,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABEL,
  type RejectionReason,
  type StorePlatform,
  type SubmissionStatus,
} from "@/lib/taxonomy";
import { daysBetween } from "@/lib/status";
import { formatDate, toInputDate } from "@/lib/format";

export type SubmissionRow = {
  id: string;
  platform: string;
  versionLabel: string;
  submittedAt: Date;
  status: string;
  decidedAt: Date | null;
  rejectionReason: string | null;
  rejectionNotes: string | null;
  resubmittedAt: Date | null;
};

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  IN_REVIEW: "border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  APPROVED: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  REJECTED: "border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  RESUBMITTED: "border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  LIVE: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
};

export function ReviewPanel({
  productId,
  submissions,
}: {
  productId: string;
  submissions: SubmissionRow[];
}) {
  const [editing, setEditing] = useState<SubmissionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const now = new Date();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold tracking-tight">Submissions</h4>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setCreating(true)}>
          <Plus className="size-3.5" />
          Log submission
        </Button>
      </div>

      {submissions.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          Nothing submitted yet. Log each store separately — they move at different speeds.
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {submissions.map((submission) => {
            const waiting = daysBetween(submission.submittedAt, submission.decidedAt ?? now);
            return (
              <li key={submission.id} className="relative pl-5">
                <span
                  className={cn(
                    "absolute top-1.5 left-0 size-2 rounded-full",
                    submission.status === "REJECTED"
                      ? "bg-rose-500"
                      : submission.status === "IN_REVIEW"
                        ? "bg-sky-500"
                        : "bg-emerald-500",
                  )}
                  aria-hidden
                />
                <span className="absolute top-4 bottom-0 left-[3px] w-px bg-border last:hidden" aria-hidden />

                <button
                  type="button"
                  onClick={() => setEditing(submission)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-foreground/25"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {PLATFORM_LABEL[submission.platform as StorePlatform]}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                      {submission.versionLabel}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        STATUS_CLASS[submission.status as SubmissionStatus],
                      )}
                    >
                      {SUBMISSION_STATUS_LABEL[submission.status as SubmissionStatus]}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Submitted {formatDate(submission.submittedAt)} ·{" "}
                    {submission.decidedAt
                      ? `decided in ${waiting} day${waiting === 1 ? "" : "s"}`
                      : `${waiting} day${waiting === 1 ? "" : "s"} waiting`}
                    {submission.resubmittedAt
                      ? ` · resubmitted ${formatDate(submission.resubmittedAt)}`
                      : ""}
                  </p>

                  {submission.rejectionReason ? (
                    <div className="mt-2 rounded-md bg-rose-500/8 px-2.5 py-2">
                      <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                        {REJECTION_REASON_LABEL[submission.rejectionReason as RejectionReason]}
                      </p>
                      {submission.rejectionNotes ? (
                        <p className="mt-0.5 text-[11px] leading-snug text-rose-700/80 dark:text-rose-300/80">
                          {submission.rejectionNotes}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <SubmissionDialog
        key={editing?.id ?? "new"}
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        productId={productId}
        submission={editing}
      />
    </div>
  );
}

function SubmissionDialog({
  open,
  onClose,
  productId,
  submission,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  submission: SubmissionRow | null;
}) {
  const [status, setStatus] = useState(submission?.status ?? "IN_REVIEW");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveSubmission(submission?.id ?? null, formData);
      if (result.ok) {
        toast.success("Submission saved");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{submission ? "Update submission" : "Log a submission"}</DialogTitle>
          <DialogDescription>
            Rejection reasons come from a fixed list so the recurring ones roll up across products.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store" htmlFor="sub-platform">
              <NativeSelect id="sub-platform" name="platform" defaultValue={submission?.platform ?? "APP_STORE"}>
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {PLATFORM_LABEL[platform]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Version" htmlFor="sub-version">
              <Input id="sub-version" name="versionLabel" defaultValue={submission?.versionLabel ?? ""} placeholder="1.0.0" required />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Submitted" htmlFor="sub-date">
              <Input
                id="sub-date"
                name="submittedAt"
                type="date"
                defaultValue={toInputDate(submission?.submittedAt ?? new Date())}
                required
              />
            </Field>
            <Field label="Status" htmlFor="sub-status">
              <NativeSelect
                id="sub-status"
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {SUBMISSION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {SUBMISSION_STATUS_LABEL[value]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {status === "REJECTED" ? (
            <>
              <Field label="Reason" htmlFor="sub-reason">
                <NativeSelect
                  id="sub-reason"
                  name="rejectionReason"
                  defaultValue={submission?.rejectionReason ?? "OTHER"}
                >
                  {REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {REJECTION_REASON_LABEL[reason]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="What they said" htmlFor="sub-notes">
                <Textarea
                  id="sub-notes"
                  name="rejectionNotes"
                  rows={3}
                  defaultValue={submission?.rejectionNotes ?? ""}
                  placeholder="Guideline 3.1.2 — renewal terms must be visible on the paywall itself."
                />
              </Field>
            </>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save submission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
