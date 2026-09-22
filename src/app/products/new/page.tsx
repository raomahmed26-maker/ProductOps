import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/product/product-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Add a product — Product Ops" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Portfolio
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Add a product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name it, say who it is for, and park it at the gate it is actually in. Documents and
          experiments attach afterwards.
        </p>
      </header>

      <ProductForm />
    </div>
  );
}
