import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** The jolly Santa face (public/santa.svg; the same art is src/app/icon.svg). */
export function LogoMark({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/santa.svg" alt="" width={44} height={44} className={cn("size-11 shrink-0", className)} />;
}

/** The wordmark. `light` for use on the green header. */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-xl leading-none font-semibold tracking-tight italic",
          light ? "text-white" : "text-foreground",
        )}
      >
        {APP_NAME}
      </span>
    </span>
  );
}

/**
 * The pine-green header with a string of Christmas lights hanging below it. `title` replaces the
 * wordmark (e.g. the exchange's name on participant pages).
 */
export function SiteHeader({
  href = "/",
  title,
  children,
}: {
  href?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative z-10">
      <div className="bg-pine-deep text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href={href} className="flex min-w-0 items-center gap-2.5">
            {title ? (
              <>
                <LogoMark />
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">
                    {APP_NAME}
                  </span>
                  <span className="block truncate font-display text-lg leading-tight font-semibold">{title}</span>
                </span>
              </>
            ) : (
              <Logo light />
            )}
          </Link>
          {children && <div className="flex shrink-0 items-center gap-2 text-sm">{children}</div>}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -bottom-4.5 bg-lights" aria-hidden />
    </header>
  );
}

/** A section heading with a small round icon badge. */
export function SectionIcon({ icon: Icon, tone = "brand" }: { icon: LucideIcon; tone?: "brand" | "pop" | "gold" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
        tone === "brand" && "bg-brand-soft text-brand",
        tone === "pop" && "bg-pop-soft text-pop",
        tone === "gold" && "bg-gold-soft text-[#7a5a0c]",
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** A small, warm sign-off at the bottom of pages. */
export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-4 pt-6 pb-10 text-center text-xs text-muted-foreground sm:px-6">
      {APP_NAME} · Checked twice by Santa&apos;s helpers. No elves were harmed. 🧝
    </footer>
  );
}
