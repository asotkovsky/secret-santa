"use client";

import { useEffect, useState } from "react";
import { AUDIT_MESSAGES } from "@/lib/jokes";

/** A spinner that cycles through the fake naughty-or-nice audit steps. */
export function AuditTicker({ title = "Naughty-or-nice audit" }: { title?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % AUDIT_MESSAGES.length), 750);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="space-y-4 py-4 text-center" role="status" aria-live="polite">
      <div className="mx-auto size-10 animate-spin rounded-full border-4 border-muted border-t-brand" />
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</p>
      <p key={i} className="animate-in font-display text-lg italic duration-300 fade-in slide-in-from-bottom-1">
        {AUDIT_MESSAGES[i]}
      </p>
    </div>
  );
}
