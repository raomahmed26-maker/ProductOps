"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { answerQuestion } from "./brain";
import type { BrainCitation } from "./brain-types";

export type BrainActionResult =
  | {
      ok: true;
      user: { id: string; role: "user"; content: string; citations: BrainCitation[]; createdAt: Date };
      assistant: {
        id: string;
        role: "assistant";
        content: string;
        citations: BrainCitation[];
        createdAt: Date;
      };
      engine: "local" | "openai" | "anthropic";
    }
  | { ok: false; error: string };

export async function askBrain(productId: string, question: string): Promise<BrainActionResult> {
  const parsed = z.string().trim().min(1, "Ask something").max(2000).safeParse(question);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) return { ok: false, error: "Unknown product" };

  const history = await db.brainMessage.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" },
    take: 16,
    select: { role: true, content: true },
  });

  const user = await db.brainMessage.create({
    data: { productId, role: "user", content: parsed.data },
  });

  const answer = await answerQuestion(productId, parsed.data, history);
  const assistant = await db.brainMessage.create({
    data: {
      productId,
      role: "assistant",
      content: answer.content,
      citations: JSON.stringify(answer.citations),
    },
  });

  revalidatePath(`/products/${product.slug}`);
  return {
    ok: true,
    user: {
      id: user.id,
      role: "user",
      content: user.content,
      citations: [],
      createdAt: user.createdAt,
    },
    assistant: {
      id: assistant.id,
      role: "assistant",
      content: assistant.content,
      citations: answer.citations,
      createdAt: assistant.createdAt,
    },
    engine: answer.engine,
  };
}

export async function clearBrain(productId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!product) return { ok: false, error: "Unknown product" };
  await db.brainMessage.deleteMany({ where: { productId } });
  revalidatePath(`/products/${product.slug}`);
  return { ok: true };
}

export async function saveProductBrief(
  productId: string,
  brief: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const product = await db.product.update({
    where: { id: productId },
    data: { brief: brief.trim() === "" ? null : brief.trim() },
  });
  revalidatePath(`/products/${product.slug}`);
  return { ok: true };
}
