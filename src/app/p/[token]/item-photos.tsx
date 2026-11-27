"use client";

import { ChevronLeft, ChevronRight, Images, XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ItemPhoto = { id: string; width: number; height: number };

/**
 * An item tile's image: the cover photo, with a count badge when there are more. Tapping it opens
 * a full-screen viewer to swipe (or arrow-key) through every photo.
 */
export function ItemPhotos({
  photos,
  photoBase,
  name,
  dimmed,
}: {
  photos: ItemPhoto[];
  /** Where photos are served from: a personal link (/p/<token>) or a guest link (/g/<shareToken>). */
  photoBase: string;
  name: string;
  dimmed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cover = photos[0];
  const src = (p: ItemPhoto) => `${photoBase}/photos/${p.id}`;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        className="relative block size-full cursor-zoom-in bg-muted"
        aria-label={photos.length > 1 ? `View ${photos.length} photos of ${name}` : `View photo of ${name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src(cover)}
          alt=""
          width={cover.width}
          height={cover.height}
          loading="lazy"
          className={cn("size-full object-cover", dimmed && "opacity-50 grayscale")}
        />
        {photos.length > 1 && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-foreground/75 px-2 py-0.5 text-[11px] font-semibold text-background shadow-sm backdrop-blur">
            <Images className="size-3" /> {photos.length}
          </span>
        )}
      </DialogPrimitive.Trigger>
      {open && <Viewer photos={photos} src={src} name={name} />}
    </DialogPrimitive.Root>
  );
}

function Viewer({ photos, src, name }: { photos: ItemPhoto[]; src: (p: ItemPhoto) => string; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = photos.length > 1;

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 duration-150 data-open:animate-in data-open:fade-in-0" />
      <DialogPrimitive.Content
        className="fixed inset-0 z-50 flex flex-col outline-none duration-150 data-open:animate-in data-open:fade-in-0"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(index + 1);
          if (e.key === "ArrowLeft") go(index - 1);
        }}
        aria-describedby={undefined}
      >
        <div className="flex items-center gap-3 px-4 py-3 text-white">
          <DialogPrimitive.Title className="min-w-0 flex-1 truncate font-sans text-sm font-semibold">
            {name}
          </DialogPrimitive.Title>
          {many && (
            <span className="text-sm text-white/70 tabular-nums" aria-live="polite">
              {index + 1} / {photos.length}
            </span>
          )}
          <DialogPrimitive.Close
            className="grid size-10 place-items-center rounded-full text-white hover:bg-white/15"
            aria-label="Close"
          >
            <XIcon className="size-5" />
          </DialogPrimitive.Close>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={track}
            className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {photos.map((p, i) => (
              <div key={p.id} className="grid size-full shrink-0 snap-center place-items-center px-2 pb-4 sm:px-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src(p)}
                  alt={many ? `${name}, photo ${i + 1} of ${photos.length}` : name}
                  width={p.width}
                  height={p.height}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              </div>
            ))}
          </div>
          {many && (
            <>
              <ArrowButton side="left" label="Previous photo" disabled={index === 0} onClick={() => go(index - 1)} />
              <ArrowButton
                side="right"
                label="Next photo"
                disabled={index === photos.length - 1}
                onClick={() => go(index + 1)}
              />
            </>
          )}
        </div>

        {many && (
          <div className="flex justify-center gap-1.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="grid size-6 place-items-center"
              >
                <span className={cn("size-2 rounded-full transition-colors", i === index ? "bg-white" : "bg-white/35")} />
              </button>
            ))}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function ArrowButton({
  side,
  label,
  ...props
}: { side: "left" | "right"; label: string } & React.ComponentProps<"button">) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-0 sm:grid",
        side === "left" ? "left-3" : "right-3",
      )}
      {...props}
    >
      <Icon className="size-6" />
    </button>
  );
}
