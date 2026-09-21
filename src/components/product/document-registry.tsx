"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
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
import { deleteDocument, saveDocument } from "@/lib/actions";
import {
  DOC_STATUSES,
  DOC_STATUS_LABEL,
  DOC_TYPES,
  DOC_TYPE_LABEL,
  type DocStatus,
  type DocType,
  type Gate,
} from "@/lib/taxonomy";
import { GATE_SPEC } from "@/lib/taxonomy";
import { formatDate } from "@/lib/format";

export type DocumentRow = {
  id: string;
  title: string;
  docType: string;
  url: string;
  owner: string;
  status: string;
  version: string;
  summary: string | null;
  updatedAt: Date;
};

const STATUS_CLASS: Record<DocStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  IN_REVIEW: "border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  APPROVED: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  SUPERSEDED: "border-border bg-muted text-muted-foreground/70 line-through",
};

export function DocumentRegistry({
  stageId,
  gate,
  documents,
}: {
  stageId: string;
  gate: Gate;
  documents: DocumentRow[];
}) {
  const [editing, setEditing] = useState<DocumentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteDocument(id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Document removed from the registry" : result.error,
      );
    });
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-xs font-semibold tracking-tight">Documents</h4>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setCreating(true)}>
          <Plus className="size-3.5" />
          Add link
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No documents linked yet. Everything for this gate lives somewhere — point at it here so it
          stops being lost.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {documents.map((doc) => (
            <li key={doc.id} className="group flex items-start gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    {doc.title}
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                      STATUS_CLASS[doc.status as DocStatus],
                    )}
                  >
                    {DOC_STATUS_LABEL[doc.status as DocStatus]}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {DOC_TYPE_LABEL[doc.docType as DocType]} · {doc.version} · {doc.owner} · updated{" "}
                  {formatDate(doc.updatedAt)}
                </p>
                {doc.summary ? (
                  <p className="mt-1 text-xs text-muted-foreground">{doc.summary}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setEditing(doc)}
                  aria-label={`Edit ${doc.title}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={pending}
                  onClick={() => remove(doc.id)}
                  aria-label={`Remove ${doc.title}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DocumentDialog
        key={editing?.id ?? "new"}
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        stageId={stageId}
        gate={gate}
        document={editing}
      />
    </div>
  );
}

function DocumentDialog({
  open,
  onClose,
  stageId,
  gate,
  document,
}: {
  open: boolean;
  onClose: () => void;
  stageId: string;
  gate: Gate;
  document: DocumentRow | null;
}) {
  const [pending, startTransition] = useTransition();
  const suggested = GATE_SPEC[gate].requiredDocTypes;

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await saveDocument(document?.id ?? null, formData);
      if (result.ok) {
        toast.success(document ? "Document updated" : "Document linked");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{document ? "Edit document" : "Link a document"}</DialogTitle>
          <DialogDescription>
            The file stays where it lives. This is the index entry that ties it to the gate.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <input type="hidden" name="stageId" value={stageId} />

          <Field label="Title" htmlFor="doc-title">
            <Input
              id="doc-title"
              name="title"
              defaultValue={document?.title}
              placeholder="Competitor pricing scan — Q3"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="doc-type">
              <NativeSelect id="doc-type" name="docType" defaultValue={document?.docType ?? suggested[0] ?? "OTHER"}>
                <optgroup label="Expected at this gate">
                  {suggested.map((type) => (
                    <option key={type} value={type}>
                      {DOC_TYPE_LABEL[type]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Everything else">
                  {DOC_TYPES.filter((type) => !suggested.includes(type)).map((type) => (
                    <option key={type} value={type}>
                      {DOC_TYPE_LABEL[type]}
                    </option>
                  ))}
                </optgroup>
              </NativeSelect>
            </Field>

            <Field label="Status" htmlFor="doc-status">
              <NativeSelect id="doc-status" name="status" defaultValue={document?.status ?? "DRAFT"}>
                {DOC_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {DOC_STATUS_LABEL[status]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field label="Link" htmlFor="doc-url" hint="Figma, Drive, Notion, the store console — wherever it actually lives.">
            <Input
              id="doc-url"
              name="url"
              type="url"
              defaultValue={document?.url}
              placeholder="https://www.figma.com/file/..."
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner" htmlFor="doc-owner">
              <Input id="doc-owner" name="owner" defaultValue={document?.owner} placeholder="Imran" required />
            </Field>
            <Field label="Version" htmlFor="doc-version">
              <Input id="doc-version" name="version" defaultValue={document?.version ?? "v1"} />
            </Field>
          </div>

          <Field label="Summary" htmlFor="doc-summary" hint="One line so a future reader knows why this exists.">
            <Textarea id="doc-summary" name="summary" defaultValue={document?.summary ?? ""} rows={2} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : document ? "Save changes" : "Link document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
