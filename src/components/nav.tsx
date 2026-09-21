"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FlaskConical, LayoutDashboard, Menu, NotebookPen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_DOT, type DerivedStatus } from "@/lib/status";
import { Button } from "@/components/ui/button";

export type NavProduct = {
  slug: string;
  name: string;
  status: DerivedStatus;
  phaseLabel: string;
};

const sections = [
  { href: "/", label: "Portfolio", icon: LayoutDashboard },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/vault", label: "Brainstorm vault", icon: NotebookPen },
];

function NavLinks({ products, onNavigate }: { products: NavProduct[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      <div className="space-y-0.5">
        {sections.map((section) => {
          const active =
            section.href === "/" ? pathname === "/" : pathname.startsWith(section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <section.icon className="size-4 shrink-0" />
              {section.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-1">
        <p className="eyebrow px-2.5">Products</p>
        <div className="space-y-0.5">
          {products.map((product) => {
            const href = `/products/${product.slug}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={product.slug}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[product.status])}
                  aria-hidden
                />
                <span className="truncate">{product.name}</span>
                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground/70">
                  {product.phaseLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function Sidebar({ products }: { products: NavProduct[] }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-6 overflow-y-auto p-4">
        <Link href="/" className="flex items-center gap-2.5 px-2.5 pt-1">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">
            P
          </span>
          <span className="text-sm font-semibold tracking-tight">Product Ops</span>
        </Link>
        <NavLinks products={products} />
        <p className="mt-auto px-2.5 text-[11px] leading-relaxed text-muted-foreground/70">
          Status on every card is derived from activity, not self-reported.
        </p>
      </div>
    </aside>
  );
}

export function MobileNav({ products }: { products: NavProduct[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">
            P
          </span>
          <span className="text-sm font-semibold tracking-tight">Product Ops</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>
      {open ? (
        <div className="border-b border-border bg-sidebar p-4">
          <NavLinks products={products} onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
