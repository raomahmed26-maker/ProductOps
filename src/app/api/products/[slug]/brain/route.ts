import { NextResponse } from "next/server";
import { getProduct } from "@/lib/queries";
import { askBrain } from "@/lib/brain-actions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const product = await getProduct(slug);
  if (!product) return NextResponse.json({ ok: false, error: "Unknown product" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { question?: string } | null;
  const question = body?.question?.trim() ?? "";
  if (!question) return NextResponse.json({ ok: false, error: "Ask something" }, { status: 400 });

  const result = await askBrain(product.id, question);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({
    ok: true,
    answer: result.assistant.content,
    citations: result.assistant.citations,
    engine: result.engine,
  });
}
