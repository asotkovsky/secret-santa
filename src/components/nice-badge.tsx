import { NICE_TONE_CLASSES, type NiceStatus } from "@/lib/nice";
import { cn } from "@/lib/utils";

export function NiceBadge({ status, className }: { status: NiceStatus | null; className?: string }) {
  if (!status) return null;
  return (
    <span
      title={status.hint}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        NICE_TONE_CLASSES[status.tone],
        className,
      )}
    >
      <span aria-hidden>{status.emoji}</span> {status.label}
    </span>
  );
}
