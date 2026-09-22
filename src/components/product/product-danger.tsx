"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { archiveProduct, deleteProduct, unarchiveProduct } from "@/lib/actions";

export function ProductDanger({
  productId,
  name,
  slug,
  archived,
}: {
  productId: string;
  name: string;
  slug: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");

  function archive() {
    startTransition(async () => {
      const result = archived ? await unarchiveProduct(productId) : await archiveProduct(productId);
      if (result.ok) {
        toast.success(archived ? "Product restored to the portfolio" : "Product archived");
        router.push(archived ? `/products/${slug}` : "/");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.ok) {
        toast.success(`${name} deleted`);
        setConfirmOpen(false);
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="mt-12 space-y-4 border-t border-border pt-8">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Remove from the portfolio</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Archive keeps the history and the experiment learnings, hidden from the dashboard. Delete
          erases the product, its documents, metrics and experiments. Vault notes are files and stay
          put.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={archive}>
          {archived ? "Restore to portfolio" : "Archive"}
        </Button>
        <Button type="button" variant="destructive" disabled={pending} onClick={() => setConfirmOpen(true)}>
          Delete permanently
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type the product name to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={name}
            aria-label="Type the product name to confirm"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || typed !== name}
              onClick={remove}
            >
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
