import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getExperiment, getProductOptions } from "@/lib/queries";
import { ExperimentForm } from "@/components/experiments/experiment-form";

export const dynamic = "force-dynamic";

export default async function EditExperimentPage({
  params,
}: PageProps<"/experiments/[refId]/edit">) {
  const { refId } = await params;
  const [experiment, products] = await Promise.all([getExperiment(refId), getProductOptions()]);
  if (!experiment) notFound();

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href={`/experiments/${experiment.refId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {experiment.refId}
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Edit {experiment.refId}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{experiment.title}</p>
      </header>

      <ExperimentForm products={products} experiment={experiment} />
    </div>
  );
}
