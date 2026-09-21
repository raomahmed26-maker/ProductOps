"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABEL,
  DIMENSION_DOT,
  DIMENSION_LABEL,
  EXPERIMENT_CATEGORIES,
  DIMENSIONS,
  type Dimension,
  type ExperimentCategory,
} from "@/lib/taxonomy";

export type FilterOption = { value: string; label: string };

export function FilterBar({ products }: { products: FilterOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function toggle(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const active = (key: string, value: string) => params.get(key) === value;
  const hasFilters = ["product", "dimension", "category"].some((key) => params.get(key));

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
      <Group label="Product">
        {products.map((product) => (
          <Chip
            key={product.value}
            active={active("product", product.value)}
            onClick={() => toggle("product", product.value)}
          >
            {product.label}
          </Chip>
        ))}
      </Group>

      <Group label="Dimension">
        {DIMENSIONS.map((dimension) => (
          <Chip
            key={dimension}
            active={active("dimension", dimension)}
            onClick={() => toggle("dimension", dimension)}
          >
            <span className={cn("size-1.5 rounded-full", DIMENSION_DOT[dimension as Dimension])} />
            {DIMENSION_LABEL[dimension as Dimension]}
          </Chip>
        ))}
      </Group>

      <Group label="Type">
        {EXPERIMENT_CATEGORIES.map((category) => (
          <Chip
            key={category}
            active={active("category", category)}
            onClick={() => toggle("category", category)}
          >
            {CATEGORY_LABEL[category as ExperimentCategory]}
          </Chip>
        ))}
      </Group>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
        active
          ? "border-foreground/30 bg-foreground/10 font-medium text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
