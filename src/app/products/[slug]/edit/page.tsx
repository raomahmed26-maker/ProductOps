import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProduct } from "@/lib/queries";
import { ProductForm } from "@/components/product/product-form";
import { ProductDanger } from "@/components/product/product-danger";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href={`/products/${product.slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {product.name}
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Edit {product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identity and thresholds. Gate progress, documents and experiments are on the product page.
        </p>
      </header>

      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          tagline: product.tagline,
          audience: product.audience,
          platforms: product.platforms,
          minWeeklyInstalls: product.minWeeklyInstalls,
          minD1: product.minD1,
          minD7: product.minD7,
        }}
      />

      <ProductDanger
        productId={product.id}
        name={product.name}
        slug={product.slug}
        archived={product.archived}
      />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product ? `Edit ${product.name} — Product Ops` : "Product not found" };
}
