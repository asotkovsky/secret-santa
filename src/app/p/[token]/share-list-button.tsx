"use client";

import { Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Shares the guest link with the phone's share sheet, or copies it where there isn't one. */
export function ShareListButton({ url }: { url: string }) {
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My wish list", text: "Here's my Christmas wish list 🎁", url });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // They closed the share sheet.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Paste it in a text or email.");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <Button variant="outline" size="sm" className="shrink-0" onClick={share}>
      <Share /> Share my list
    </Button>
  );
}
