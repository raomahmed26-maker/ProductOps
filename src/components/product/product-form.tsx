"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { createProduct, updateProduct } from "@/lib/actions";
import { GATES, GATE_SPEC, type Gate } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

export type ProductFormValues = {
  id: string;
  name: string;
  tagline: string;
  audience: string;
  platforms: string;
  minWeeklyInstalls: number;
  minD1: number;
  minD7: number;
};

export function ProductForm({ product }: { product?: ProductFormValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const existing = product?.platforms.split(",") ?? ["ios", "android"];
  const [ios, setIos] = useState(existing.includes("ios"));
  const [android, setAndroid] = useState(existing.includes("android"));
  const [startingGate, setStartingGate] = useState<Gate>("MARKET_RESEARCH");

  const platforms = [ios ? "ios" : null, android ? "android" : null].filter(Boolean).join(",");
  const startIndex = GATES.indexOf(startingGate);

  function submit(formData: FormData) {
    formData.set("platforms", platforms);
    startTransition(async () => {
      const result = product
        ? await updateProduct(formData)
        : await createProduct(formData);
      if (result.ok && result.slug) {
        toast.success(product ? "Product updated" : "Product added to the portfolio");
        router.push(`/products/${result.slug}`);
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={submit} className="space-y-8">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <input type="hidden" name="platforms" value={platforms} />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">The product</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enough to recognise it on the dashboard. Detail lives in the documents you link later.
          </p>
        </div>

        <Field label="Name" htmlFor="p-name">
          <Input
            id="p-name"
            name="name"
            defaultValue={product?.name}
            placeholder="LedgerLane"
            required
          />
        </Field>

        <Field label="One-line description" htmlFor="p-tagline">
          <Input
            id="p-tagline"
            name="tagline"
            defaultValue={product?.tagline}
            placeholder="Receipt-first bookkeeping for sole traders"
            required
          />
        </Field>

        <Field label="Who it is for" htmlFor="p-audience">
          <Input
            id="p-audience"
            name="audience"
            defaultValue={product?.audience}
            placeholder="UK sole traders who invoice from their phone"
            required
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium">Stores</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ios}
                onChange={(event) => setIos(event.target.checked)}
                className="size-4 rounded border-input"
              />
              iOS / App Store
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={android}
                onChange={(event) => setAndroid(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Android / Play Store
            </label>
          </div>
          {platforms === "" ? (
            <p className="text-[11px] text-destructive">Pick at least one store.</p>
          ) : null}
        </fieldset>
      </section>

      {product ? null : (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Where it is now</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every product gets all eight gates. Anything before this one is marked complete so an
              in-flight app can sit at the right place without inventing a history for it. You still
              need to link the documents those earlier gates required if you want the checklists
              honest.
            </p>
          </div>

          <input type="hidden" name="startingGate" value={startingGate} />

          <ol className="space-y-1.5">
            {GATES.map((gate, index) => {
              const spec = GATE_SPEC[gate];
              const selected = gate === startingGate;
              return (
                <li key={gate}>
                  <button
                    type="button"
                    onClick={() => setStartingGate(gate)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "border-foreground/30 bg-muted/60"
                        : "border-border hover:border-foreground/20",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                        selected ? "border-foreground bg-foreground" : "border-input",
                      )}
                    >
                      {selected ? <span className="size-1.5 rounded-full bg-background" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium">{spec.label}</span>
                        {index < startIndex ? (
                          <span className="text-[11px] text-muted-foreground">will be marked complete</span>
                        ) : index === startIndex ? (
                          <span className="text-[11px] text-muted-foreground">starts here</span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{spec.intent}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Keep / kill thresholds</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Used once the app is live. Two consecutive weeks under any of these puts it on kill
            watch. Defaults are the portfolio rule of 1,000 weekly installs, D1 55% and D7 15%.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min weekly installs" htmlFor="p-installs">
            <Input
              id="p-installs"
              name="minWeeklyInstalls"
              type="number"
              min={0}
              defaultValue={product?.minWeeklyInstalls ?? 1000}
              required
            />
          </Field>
          <Field label="Min D1 retention %" htmlFor="p-d1">
            <Input
              id="p-d1"
              name="minD1"
              type="number"
              min={0}
              max={100}
              step="0.1"
              defaultValue={product?.minD1 ?? 55}
              required
            />
          </Field>
          <Field label="Min D7 retention %" htmlFor="p-d7">
            <Input
              id="p-d7"
              name="minD7"
              type="number"
              min={0}
              max={100}
              step="0.1"
              defaultValue={product?.minD7 ?? 15}
              required
            />
          </Field>
        </div>
      </section>

      <div className="flex gap-2 border-t border-border pt-5">
        <Button type="submit" disabled={pending || platforms === ""}>
          {pending ? "Saving..." : product ? "Save changes" : "Add product"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
