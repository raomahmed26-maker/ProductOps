import Link from "next/link";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

// Base UI's Button takes `render`, not `asChild`. A link that looks like a
// button is common enough here to be worth its own component.
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
