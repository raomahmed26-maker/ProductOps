"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
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
import { saveStage } from "@/lib/actions";
import { STAGE_STATUSES, STAGE_STATUS_LABEL } from "@/lib/taxonomy";
import type { StageData } from "./stage-panel";

export function StageControls({ stage }: { stage: StageData }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(stage.status);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveStage(formData);
      if (result.ok) {
        toast.success("Stage updated");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Settings2 className="size-3.5" />
        Stage settings
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stage settings</DialogTitle>
            <DialogDescription>
              Completing a gate moves the product to the next open one automatically.
            </DialogDescription>
          </DialogHeader>

          <form action={submit} className="space-y-4">
            <input type="hidden" name="stageId" value={stage.id} />

            <Field label="Status" htmlFor="stage-status">
              <NativeSelect
                id="stage-status"
                name="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STAGE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STAGE_STATUS_LABEL[value]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            {status === "BLOCKED" ? (
              <Field
                label="What is blocking it"
                htmlFor="stage-blocked"
                hint="This shows on the dashboard until it is cleared."
              >
                <Input
                  id="stage-blocked"
                  name="blockedReason"
                  defaultValue={stage.blockedReason ?? ""}
                  placeholder="Waiting on revised store graphics"
                  required
                />
              </Field>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Owner" htmlFor="stage-owner">
                <Input id="stage-owner" name="owner" defaultValue={stage.owner ?? ""} placeholder="Imran" />
              </Field>
              <Field
                label="Expected days"
                htmlFor="stage-days"
                hint="Used to age the stage."
              >
                <Input
                  id="stage-days"
                  name="expectedDays"
                  type="number"
                  min={1}
                  max={120}
                  defaultValue={stage.expectedDays}
                />
              </Field>
            </div>

            <Field label="Notes" htmlFor="stage-notes">
              <Textarea id="stage-notes" name="notes" defaultValue={stage.notes ?? ""} rows={3} />
            </Field>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save stage"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
