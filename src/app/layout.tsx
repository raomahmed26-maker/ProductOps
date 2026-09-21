import type { Metadata } from "next";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const portfolio = await getPortfolio();
  const products: NavProduct[] = portfolio.map((product) => ({
    slug: product.slug,
    name: product.name,
    status: product.derived.status,
    phaseLabel: PHASE_LABEL[product.phase].replace("-production", "-prod"),
  }));

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
