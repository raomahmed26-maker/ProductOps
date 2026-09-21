"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, PanelsTopLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/field";
import { removeNote, saveNote } from "@/lib/vault-actions";

export type NoteDraft = {
  slug?: string;
  title: string;
  tags: string[];
  products: string[];
  experiments: string[];
  body: string;
};

type Mode = "write" | "split" | "preview";

export function NoteEditor({
  note,
  productOptions,
  experimentOptions,
}: {
  note: NoteDraft;
  productOptions: { slug: string; name: string }[];
  experimentOptions: { refId: string; title: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("split");
  const [body, setBody] = useState(note.body);
  const [products, setProducts] = useState<string[]>(note.products);
  const [experiments, setExperiments] = useState<string[]>(note.experiments);

  function submit(formData: FormData) {
    formData.set("products", products.join(","));
    formData.set("experiments", experiments.join(","));
    formData.set("body", body);
    startTransition(async () => {
      const result = await saveNote(formData);
      if (result.ok) {
        toast.success("Note saved to the vault");
        router.push(`/vault/${result.slug}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function destroy() {
    if (!note.slug) return;
    startTransition(async () => {
      await removeNote(note.slug!);
      toast.success("Note deleted");
      router.push("/vault");
    });
  }

  return (
    <form action={submit} className="space-y-5">
      {note.slug ? <input type="hidden" name="slug" value={note.slug} /> : null}

      <Field label="Title" htmlFor="n-title">
        <Input
          id="n-title"
          name="title"
          defaultValue={note.title}
          placeholder="Why our paywall converts half as often as the category"
          className="text-base"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tags" htmlFor="n-tags" hint="Comma separated. Tags survive across products.">
          <Input
            id="n-tags"
            name="tags"
            defaultValue={note.tags.join(", ")}
            placeholder="paywall, pricing, competitor"
          />
        </Field>

        <Field label="Linked products" hint="Makes this note appear on those product pages.">
          <TokenPicker
            options={productOptions.map((p) => ({ value: p.slug, label: p.name }))}
            selected={products}
            onToggle={(value) =>
              setProducts((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
              )
            }
          />
        </Field>
      </div>

      {experimentOptions.length > 0 ? (
        <Field label="Linked experiments" hint="Ties the thinking to the test it argues for.">
          <TokenPicker
            options={experimentOptions.map((e) => ({ value: e.refId, label: e.refId }))}
            selected={experiments}
            onToggle={(value) =>
              setExperiments((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
              )
            }
            dense
          />
        </Field>
      ) : null}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium">Note</span>
          <div className="flex rounded-md border border-border p-0.5">
            <ModeButton active={mode === "write"} onClick={() => setMode("write")} icon={Pencil} label="Write" />
            <ModeButton active={mode === "split"} onClick={() => setMode("split")} icon={PanelsTopLeft} label="Split" />
            <ModeButton active={mode === "preview"} onClick={() => setMode("preview")} icon={Eye} label="Preview" />
          </div>
        </div>

        <div
          className={cn(
            "grid gap-3",
            mode === "split" ? "lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {mode !== "preview" ? (
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={22}
              className="resize-y font-mono text-[13px] leading-6"
              placeholder={
                "Markdown. Link to another note with [[Note title]].\n\n## What I noticed\n\n## What it might mean\n\n## What I'd test"
              }
            />
          ) : null}

          {mode !== "write" ? (
            <div className="min-h-40 overflow-auto rounded-md border border-border bg-card px-4 py-3">
              {body.trim() === "" ? (
                <p className="text-xs text-muted-foreground">Nothing to preview yet.</p>
              ) : (
                <div className="prose-note">
                  <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Saved as{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">
            vault/notes/{note.slug ?? "your-title"}.md
          </code>
          . Open the vault folder in Obsidian and it is just a note.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save note"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        {note.slug ? (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-destructive"
            disabled={pending}
            onClick={destroy}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Eye;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function TokenPicker({
  options,
  selected,
  onToggle,
  dense = false,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  dense?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onToggle(option.value)}
          className={cn(
            "rounded-full border px-2.5 py-1 transition-colors",
            dense ? "font-mono text-[10px]" : "text-[11px]",
            selected.includes(option.value)
              ? "border-foreground/30 bg-foreground/10 font-medium text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
