import type { Metadata } from "next";
import { connection } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { MobileNav, Sidebar, type NavProduct } from "@/components/nav";
import { getPortfolio } from "@/lib/queries";
import { PHASE_LABEL } from "@/lib/taxonomy";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Product Ops Workspace",
  description:
    "One place for the stage-gate pipeline, the experiment repository and the thinking behind both.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Skip static generation. Vercel prerender was querying Prisma before any
  // database existed, which failed the build on /_not-found.
  await connection();

  let products: NavProduct[] = [];
  try {
    const portfolio = await getPortfolio();
    products = portfolio.map((product) => ({
      slug: product.slug,
      name: product.name,
      status: product.derived.status,
      phaseLabel: PHASE_LABEL[product.phase].replace("-production", "-prod"),
    }));
  } catch (error) {
    console.error("Could not load navigation products", error);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <div className="flex min-h-dvh flex-col lg:flex-row">
          <MobileNav products={products} />
          <Sidebar products={products} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
