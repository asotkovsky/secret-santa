"use client";

import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/confirm-button";
import { Field, TextareaField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/components/use-action";
import { addItemAction, arrangePhotosAction, deleteItemAction, updateItemAction } from "./actions";
import { ItemCard, ItemGrid, type ItemView } from "./item-card";

const MAX_LINKS = 5;
/** Keep in step with MAX_PHOTOS in src/server/wishlists.ts. */
const MAX_PHOTOS = 10;
const MAX_SIDE = 1200;

export function MyList({ token, items }: { token: string; items: ItemView[] }) {
  const { run } = useAction();
  const [editing, setEditing] = useState<ItemView | "new" | null>(null);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="space-y-4 rounded-2xl border-2 border-dashed border-gold/50 bg-card p-8 text-center">
          <p className="text-3xl" aria-hidden>
            🦌
          </p>
          <p className="text-muted-foreground">
            Santa can&apos;t read minds (officially). Add a few ideas so your Secret Santa knows what you&apos;d love!
          </p>
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add a gift idea
          </Button>
        </div>
      ) : (
        <ItemGrid>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              photoBase={`/p/${token}`}
              item={item}
              actions={
                <>
                  <TileButton label={`Edit ${item.name}`} onClick={() => setEditing(item)}>
                    <Pencil />
                  </TileButton>
                  <ConfirmButton
                    title={`Remove "${item.name}"?`}
                    confirmLabel="Remove"
                    onConfirm={() => run(() => deleteItemAction(token, item.id))}
                  >
                    <TileButton label={`Remove ${item.name}`}>
                      <Trash2 />
                    </TileButton>
                  </ConfirmButton>
                </>
              }
            />
          ))}
          <li>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/60 bg-card/60 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
            >
              <Plus className="size-7" />
              Add a gift idea
            </button>
          </li>
        </ItemGrid>
      )}
      <ItemDialog token={token} editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/** A small round icon button that floats over an item's image. */
function TileButton({ label, ...props }: { label: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-9 place-items-center rounded-full bg-card/95 text-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur transition-colors hover:bg-card hover:text-brand sm:size-8 [&_svg]:size-4"
      {...props}
    />
  );
}

/**
 * Checks a chosen file is a photo this browser can open, before it's attached. Returns a message
 * that says exactly what's wrong, or null when the file is fine.
 */
async function photoProblem(file: File): Promise<string | null> {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toUpperCase() : "";
  if (!file.type.startsWith("image/") && !["HEIC", "HEIF"].includes(ext)) {
    return `"${file.name}" isn't a photo. Choose an image file: JPG, PNG, WebP or GIF.`;
  }
  try {
    (await createImageBitmap(file)).close();
    return null;
  } catch {
    return ext
      ? `"${file.name}" is a ${ext} image, which this browser can't open. Save it as a JPG or PNG (or take a screenshot of it) and try again.`
      : `"${file.name}" couldn't be opened as an image. Choose a JPG, PNG, WebP or GIF.`;
  }
}

/** Shrinks a photo to at most 1200px on its long side as a JPEG, respecting the camera's rotation. */
async function resize(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error(`"${file.name}" couldn't be opened as an image. Choose a JPG, PNG, WebP or GIF.`);
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Couldn't process the photo");
  return { blob, width, height };
}

/** A photo in the item form: one already saved, or one chosen but not uploaded yet. */
type PhotoEntry =
  | { kind: "saved"; key: string; photo: ItemView["photos"][number] }
  | { kind: "new"; key: string; file: File; preview: string };

/** Uploads one photo, added after the item's others; returns its id. */
async function uploadPhoto(token: string, itemId: string, file: File): Promise<string> {
  const { blob, width, height } = await resize(file);
  const body = new FormData();
  body.set("file", blob, "photo.jpg");
  body.set("width", String(width));
  body.set("height", String(height));
  const res = await fetch(`/p/${token}/items/${itemId}/photo`, { method: "POST", body });
  const json = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; error?: string; photoId?: string };
  if (!json.ok || !json.photoId) throw new Error(json.error ?? "Couldn't upload the photo");
  return json.photoId;
}

function ItemDialog({
  token,
  editing,
  onClose,
}: {
  token: string;
  editing: ItemView | "new" | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { run } = useAction();
  const item = editing && editing !== "new" ? editing : null;
  const [links, setLinks] = useState<string[]>([""]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<typeof editing>(null);

  // Reset the form whenever the dialog opens for a different item.
  if (openFor !== editing) {
    setOpenFor(editing);
    setLinks(item?.links.length ? item.links : [""]);
    setPhotos(item?.photos.map((photo) => ({ kind: "saved", key: photo.id, photo })) ?? []);
    setPhotoError(null);
  }

  const previewOf = (p: PhotoEntry) => (p.kind === "new" ? p.preview : `/p/${token}/photos/${p.photo.id}`);

  async function choosePhotos(files: File[]) {
    const room = MAX_PHOTOS - photos.length;
    const problems: string[] = [];
    if (files.length > room) {
      problems.push(`An item can have up to ${MAX_PHOTOS} photos, so only the first ${room} were added.`);
    }
    const added: PhotoEntry[] = [];
    for (const file of files.slice(0, room)) {
      const problem = await photoProblem(file);
      if (problem) problems.push(problem);
      else added.push({ kind: "new", key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }
    setPhotoError(problems.join(" ") || null);
    setPhotos((current) => [...current, ...added].slice(0, MAX_PHOTOS));
  }

  /**
   * Brings the saved item's photos in line with the form: removes dropped ones first (so new ones
   * fit under the limit), uploads new ones one at a time, then saves the order.
   */
  async function savePhotos(itemId: string) {
    const ids = (list: PhotoEntry[]) => list.flatMap((p) => (p.kind === "saved" ? [p.photo.id] : []));
    const kept = ids(photos);
    const before = item?.photos.map((p) => p.id) ?? [];
    const fresh = photos.filter((p) => p.kind === "new");
    if (kept.join() !== before.join()) await run(() => arrangePhotosAction(token, itemId, kept));
    if (!fresh.length) return;

    const uploaded = new Map<string, string>();
    const failures: string[] = [];
    for (const [i, p] of fresh.entries()) {
      setProgress(fresh.length > 1 ? `Uploading photo ${i + 1} of ${fresh.length}…` : "Uploading photo…");
      try {
        uploaded.set(p.key, await uploadPhoto(token, itemId, p.file));
      } catch (err) {
        failures.push((err as Error).message);
      }
    }
    if (failures.length) {
      toast.error(
        failures.length === 1
          ? `Saved, but a photo didn't upload: ${failures[0]}`
          : `Saved, but ${failures.length} photos didn't upload: ${failures[0]}`,
      );
    }
    if (uploaded.size) {
      const order = photos.flatMap((p) =>
        p.kind === "saved" ? [p.photo.id] : uploaded.has(p.key) ? [uploaded.get(p.key)!] : [],
      );
      await run(() => arrangePhotosAction(token, itemId, order));
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const input = {
      name: String(data.get("name") ?? ""),
      notes: String(data.get("notes") ?? ""),
      links: links.map((l) => l.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      const saved = await run(() => (item ? updateItemAction(token, item.id, input) : addItemAction(token, input)));
      if (!saved) return;
      await savePhotos(saved.itemId);
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
      setProgress(null);
    }
  }

  return (
    <Dialog open={editing !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onOpenAutoFocus={(e) => item && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{item ? "Edit gift idea" : "Add a gift idea 🎁"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" key={item?.id ?? "new"}>
          <Field
            name="name"
            label="What would you like?"
            required
            maxLength={200}
            placeholder="e.g. Cozy wool socks"
            defaultValue={item?.name}
          />

          <div className="space-y-2">
            <Label>
              Photos <span className="font-normal text-muted-foreground">optional, up to {MAX_PHOTOS}</span>
            </Label>
            <ul className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <li key={p.key} className="relative size-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewOf(p)} alt="" className="size-full rounded-xl border object-cover" />
                  {i === 0 ? (
                    <span className="absolute bottom-1 left-1 rounded-full bg-foreground/80 px-1.5 py-px text-[10px] font-semibold text-background">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPhotos([p, ...photos.filter((q) => q !== p)])}
                      className="absolute bottom-1 left-1 rounded-full bg-card/95 px-1.5 py-px text-[10px] font-semibold shadow-sm ring-1 ring-foreground/10 hover:text-brand"
                    >
                      Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => {
                      if (p.kind === "new") URL.revokeObjectURL(p.preview);
                      setPhotos(photos.filter((q) => q !== p));
                      setPhotoError(null);
                    }}
                    className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-card shadow-sm ring-1 ring-foreground/15 hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
              {photos.length < MAX_PHOTOS && (
                <li>
                  <Label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-xs font-normal text-muted-foreground hover:border-brand/50 hover:text-brand">
                    <ImagePlus className="size-5" />
                    {photos.length ? "Add more" : "Add photos"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length) void choosePhotos(files);
                        e.target.value = "";
                      }}
                    />
                  </Label>
                </li>
              )}
            </ul>
            {photoError && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {photoError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Links <span className="font-normal text-muted-foreground">optional</span>
            </Label>
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="text"
                  inputMode="url"
                  placeholder="Paste a link to the store page"
                  value={link}
                  aria-label={`Link ${i + 1}`}
                  onChange={(e) => setLinks(links.map((l, j) => (j === i ? e.target.value : l)))}
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove link"
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}
            {links.length < MAX_LINKS && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLinks([...links, ""])}>
                <Plus /> Add another link
              </Button>
            )}
          </div>

          <TextareaField
            name="notes"
            label="Notes"
            optional
            placeholder="e.g. Size medium, any color but yellow"
            maxLength={1000}
            rows={3}
            defaultValue={item?.notes ?? ""}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {progress ?? (item ? "Save changes" : "Add to my list")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
