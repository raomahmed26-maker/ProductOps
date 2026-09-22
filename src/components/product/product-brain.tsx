"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, SendHorizontal, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askBrain, clearBrain, saveProductBrief } from "@/lib/brain-actions";
import { cn } from "@/lib/utils";
import type { BrainCitation } from "@/lib/brain-types";

export type BrainChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: BrainCitation[];
  createdAt: Date;
};

const STARTERS = [
  "Where is the recent PRD?",
  "What was the v3 update on onboarding?",
  "Which experiments are running on this product?",
  "What does this week's health look like?",
];

export function ProductBrain({
  productId,
  productName,
  brief,
  messages: initial,
}: {
  productId: string;
  productName: string;
  brief: string | null;
  messages: BrainChatMessage[];
}) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [briefDraft, setBriefDraft] = useState(brief ?? "");
  const [briefOpen, setBriefOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setDraft("");
    const optimistic: BrainChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      citations: [],
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const result = await askBrain(productId, text);
      if (!result.ok) {
        toast.error(result.error);
        setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
        setDraft(text);
        return;
      }
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== optimistic.id),
        result.user,
        result.assistant,
      ]);
    });
  }

  function reset() {
    startTransition(async () => {
      const result = await clearBrain(productId);
      if (result.ok) {
        setMessages([]);
        toast.success("Conversation cleared");
      } else {
        toast.error(result.error);
      }
    });
  }

  function saveBrief() {
    startTransition(async () => {
      const result = await saveProductBrief(productId, briefDraft);
      if (result.ok) toast.success("Brief saved — the brain will read it on the next question");
      else toast.error(result.error);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">Product brain</h2>
          </div>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Ask anything about {productName}&apos;s documents, notes, experiments and numbers. It
            only sees this product — not the rest of the portfolio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setBriefOpen((v) => !v)}>
            Living brief
          </Button>
          {messages.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={pending}>
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </header>

      {briefOpen ? (
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Paste the bits the registry cannot hold — a changelog paragraph, a decision, a version
            note. Document summaries and vault notes are already in context.
          </p>
          <Textarea
            value={briefDraft}
            onChange={(event) => setBriefDraft(event.target.value)}
            rows={6}
            className="mt-2"
            placeholder="v3 onboarding: three screens, camera permission delayed until first capture, signup deferred to export…"
          />
          <div className="mt-2">
            <Button type="button" size="sm" onClick={saveBrief} disabled={pending}>
              Save brief
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex max-h-[min(70vh,640px)] min-h-[420px] flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <EmptyState productName={productName} onAsk={ask} disabled={pending} />
          ) : (
            <ol className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {pending ? (
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Sparkles className="mt-0.5 size-3.5 animate-pulse" />
                  Reading this product&apos;s context…
                </li>
              ) : null}
              <div ref={bottom} />
            </ol>
          )}
        </div>

        <form
          className="border-t border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            ask(draft);
          }}
        >
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  ask(draft);
                }
              }}
              rows={2}
              placeholder={`Ask ${productName}…`}
              className="min-h-11 resize-none"
              disabled={pending}
            />
            <Button type="submit" size="icon" disabled={pending || draft.trim() === ""} aria-label="Send">
              <SendHorizontal className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Enter to send · Shift+Enter for a new line. It cannot open Figma or Drive — only what
            you stored here.
          </p>
        </form>
      </div>
    </div>
  );
}

function EmptyState({
  productName,
  onAsk,
  disabled,
}: {
  productName: string;
  onAsk: (question: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid min-h-[320px] place-items-center px-2 py-8 text-center">
      <div>
        <Brain className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Ask {productName} anything on file</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Where a document lives, what a version changed, which experiment is running — if it is in
          this product, the brain can point at it.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {STARTERS.map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              onClick={() => onAsk(question)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs transition-colors hover:border-foreground/25 hover:bg-muted/60 disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: BrainChatMessage }) {
  const assistant = message.role === "assistant";
  return (
    <li className={cn("flex", assistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[min(100%,40rem)] rounded-2xl px-3.5 py-2.5 text-sm",
          assistant ? "bg-muted/70" : "bg-primary text-primary-foreground",
        )}
      >
        {assistant ? (
          <div className="prose-brain">
            <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
        {assistant && message.citations.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((citation) => (
              <li key={`${citation.kind}:${citation.title}`}>
                {citation.href ? (
                  <a
                    href={citation.href}
                    target={citation.href.startsWith("http") ? "_blank" : undefined}
                    rel={citation.href.startsWith("http") ? "noreferrer" : undefined}
                    className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:border-foreground/30"
                  >
                    {citation.title}
                  </a>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px]">
                    {citation.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
