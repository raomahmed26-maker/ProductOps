"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/forms/field";
import { promoteNoteToExperiment } from "@/lib/vault-actions";

/** The moment a half-formed thought becomes something you can actually test. */
export function PromoteToExperiment({
  slug,
  products,
  alreadyLinked,
}: {
  slug: string;
  products: { id: string; name: string }[];
  alreadyLinked: string[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function promote() {
    startTransition(async () => {
      const result = await promoteNoteToExperiment(slug, productId);
      if (result.ok) {
        toast.success(`${result.refId} added to the backlog`);
        router.push(`/experiments/${result.refId}/edit`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <FlaskConical className="size-3.5" />
            Turn this into an experiment
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {alreadyLinked.length > 0
              ? `Already produced ${alreadyLinked.join(", ")}. You can queue another.`
              : "Creates a backlog entry with this note carried across as the rationale."}
          </p>
        </div>

        <div className="flex gap-2">
          <NativeSelect
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="h-8 w-auto text-xs"
            aria-label="Product"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </NativeSelect>
          <Button size="sm" variant="outline" onClick={promote} disabled={pending || !productId}>
            {pending ? "Creating..." : "Queue it"}
          </Button>
        </div>
      </div>
    </section>
  );
}
