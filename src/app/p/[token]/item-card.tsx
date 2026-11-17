import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type ItemView = {
  id: string;
  name: string;
  links: string[];
  notes: string | null;
  photoId: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
};

function linkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * One wish-list item. `actions` sits beside the name, `footer` below everything (e.g. the
 * "I bought this" button), and `dimmed` greys it out (already bought).
 */
export function ItemCard({
  token,
  item,
  actions,
  badge,
  footer,
  dimmed = false,
}: {
  token: string;
  item: ItemView;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <li className={cn("space-y-3 rounded-2xl border bg-card p-4", dimmed && "bg-muted/50")}>
      <div className={cn("flex gap-4", dimmed && "opacity-55")}>
        {item.photoId && (
          <a
            href={`/p/${token}/photos/${item.photoId}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 overflow-hidden rounded-xl border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/p/${token}/photos/${item.photoId}`}
              alt=""
              width={item.photoWidth ?? undefined}
              height={item.photoHeight ?? undefined}
              loading="lazy"
              className={cn("size-24 object-cover sm:size-28", dimmed && "grayscale")}
            />
          </a>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <h3
                className={cn(
                  "font-sans font-semibold [overflow-wrap:anywhere]",
                  dimmed && "line-through decoration-1",
                )}
              >
                {item.name}
              </h3>
              {badge}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
          </div>
          {item.notes && (
            <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-line text-muted-foreground">{item.notes}</p>
          )}
          {item.links.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {item.links.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-8 items-center gap-1 font-medium text-pop underline-offset-2 hover:underline"
                  >
                    {linkLabel(url)} <ExternalLink className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {footer}
    </li>
  );
}
