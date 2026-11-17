import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { label: string; done: boolean; optional?: boolean; href: string };

/** The organizer's to-do list, with the first unfinished step highlighted. */
export function Steps({ steps }: { steps: Step[] }) {
  const next = steps.findIndex((s) => !s.done && !s.optional);
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.label}>
          <a
            href={s.href}
            className={cn(
              "flex h-full items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-sm transition-colors hover:border-brand/40",
              i === next && "border-brand bg-brand-soft ring-2 ring-brand/15",
              s.done && "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                s.done ? "bg-pop text-white" : i === next ? "bg-brand text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {s.done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className="leading-tight">
              {s.label}
              {s.optional && !s.done && <span className="block text-xs text-muted-foreground">optional</span>}
              {i === next && <span className="block text-xs font-semibold text-brand">Next up</span>}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
