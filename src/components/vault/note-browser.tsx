"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NotebookPen, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button-link";

export type NoteSummary = {
  slug: string;
  title: string;
  tags: string[];
  products: string[];
  experiments: string[];
  updated: string;
  excerpt: string;
  searchText: string;
};

export function NoteBrowser({
  notes,
  tags,
  productNames,
}: {
  notes: NoteSummary[];
  tags: { tag: string; count: number }[];
  productNames: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (activeTag && !note.tags.includes(activeTag)) return false;
      if (q && !note.searchText.includes(q)) return false;
      return true;
    });
  }, [notes, query, activeTag]);

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div>
          <p className="eyebrow mb-2">Tags</p>
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 lg:flex-col lg:items-start">
              {tags.map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                  className={cn(
                    "inline-flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors",
                    activeTag === tag
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="truncate">#{tag}</span>
                  <span className="numeric shrink-0 text-[10px] text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, tags and note bodies"
            className="pl-9"
          />
        </div>

        {activeTag ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Filtered to #{activeTag}.{" "}
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Clear
            </button>
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-14 text-center">
            <NotebookPen className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              {notes.length === 0 ? "The vault is empty" : "Nothing matches"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              {notes.length === 0
                ? "This is the space before the structure. Dump the half-formed thought here, tag it, and link it to a product when it firms up."
                : "Try a different search, or clear the tag filter."}
            </p>
            {notes.length === 0 ? (
              <ButtonLink href="/vault/new" size="sm" className="mt-4">
                Write the first note
              </ButtonLink>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {filtered.map((note) => (
              <li key={note.slug}>
                <Link
                  href={`/vault/${note.slug}`}
                  className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
                >
                  <h3 className="text-sm font-semibold tracking-tight">{note.title}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {note.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                    {note.products.map((slug) => (
                      <span
                        key={slug}
                        className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {productNames[slug] ?? slug}
                      </span>
                    ))}
                    {note.experiments.map((refId) => (
                      <span
                        key={refId}
                        className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {refId}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground/70">updated {note.updated}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
