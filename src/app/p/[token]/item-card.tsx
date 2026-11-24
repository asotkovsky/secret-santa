import { ArrowUpRight, Gift } from "lucide-react";
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

/** Soft festive tints for items without a photo, picked per item so a grid isn't all one color. */
const PLACEHOLDER_TINTS = ["bg-brand-soft text-brand/60", "bg-pop-soft text-pop/60", "bg-gold-soft text-[#7a5a0c]/60"];
function tintFor(id: string) {
  let n = 0;
  for (const ch of id) n = (n + ch.charCodeAt(0)) % PLACEHOLDER_TINTS.length;
  return PLACEHOLDER_TINTS[n];
}

/** Lays out item cards as a shopping-style grid. `wide` adds a fourth column on big screens. */
export function ItemGrid({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4", wide && "lg:grid-cols-4")}>{children}</ul>
  );
}

/**
 * One wish-list item as a product tile: a square image (or a festive placeholder), then the
 * name, notes and store links. `actions` float over the image's corner, `tag` sits on the image's
 * other corner, `footer` (e.g. "I bought this") is pinned to the bottom so buttons line up in a
 * row, and `dimmed` greys the whole tile out (already bought).
 */
export function ItemCard({
  photoBase,
  item,
  actions,
  tag,
  footer,
  dimmed = false,
}: {
  /** Where photos are served from: a personal link (/p/<token>) or a guest link (/g/<shareToken>). */
  photoBase: string;
  item: ItemView;
  actions?: React.ReactNode;
  tag?: React.ReactNode;
  footer?: React.ReactNode;
  dimmed?: boolean;
}) {
  const photo = item.photoId ? `${photoBase}/photos/${item.photoId}` : null;
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition-shadow hover:shadow-md",
        dimmed && "bg-muted/40",
      )}
    >
      <div className="relative aspect-square">
        {photo ? (
          <a href={photo} target="_blank" rel="noreferrer" className="block size-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              width={item.photoWidth ?? undefined}
              height={item.photoHeight ?? undefined}
              loading="lazy"
              className={cn("size-full object-cover", dimmed && "opacity-50 grayscale")}
            />
          </a>
        ) : (
          <div
            aria-hidden
            className={cn("grid size-full place-items-center", tintFor(item.id), dimmed && "opacity-50 grayscale")}
          >
            <Gift className="size-1/3" strokeWidth={1.4} />
          </div>
        )}
        {tag && <div className="absolute top-2 left-2">{tag}</div>}
        {actions && <div className="absolute top-2 right-2 flex gap-1">{actions}</div>}
      </div>

      <div className={cn("flex flex-1 flex-col gap-1 p-3", dimmed && "opacity-60")}>
        <h3 className="font-sans text-sm leading-snug font-semibold [overflow-wrap:anywhere]">
          {item.name}
        </h3>
        {item.notes && (
          <p className="text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-line text-muted-foreground">
            {item.notes}
          </p>
        )}
        {item.links.length > 0 && (
          <ul className="flex flex-wrap gap-x-2.5 gap-y-0.5 pt-0.5 text-xs">
            {item.links.map((url) => (
              <li key={url} className="min-w-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex max-w-full items-center gap-0.5 py-1 font-medium text-pop underline-offset-2 hover:underline"
                >
                  <span className="truncate">{linkLabel(url)}</span>
                  <ArrowUpRight className="size-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        )}
        {footer && <div className="mt-auto pt-2">{footer}</div>}
      </div>
    </li>
  );
}

/** A small pill over an item's image, e.g. "Bought". */
export function ItemTag({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm",
        tone === "dark" ? "bg-foreground/85 text-background" : "bg-card/95 text-foreground",
      )}
    >
      {children}
    </span>
  );
}
