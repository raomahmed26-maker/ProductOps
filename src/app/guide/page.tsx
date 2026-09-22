import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { readGuide } from "@/lib/guide";

export const dynamic = "force-dynamic";

export const metadata = { title: "Owner’s guide — Product Ops" };

function headingText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(headingText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return headingText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function headingId(node: ReactNode): string {
  return headingText(node)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function GuidePage() {
  const markdown = readGuide();

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-8 lg:py-10">
      <article className="prose-note">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 id={headingId(children)} className="scroll-mt-8">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 id={headingId(children)} className="scroll-mt-8">
                {children}
              </h3>
            ),
          }}
        >
          {markdown}
        </Markdown>
      </article>
    </div>
  );
}
