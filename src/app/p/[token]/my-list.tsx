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
import { addItemAction, deleteItemAction, removePhotoAction, updateItemAction } from "./actions";
import { ItemCard, type ItemView } from "./item-card";
import { Reactions } from "./reactions";

const MAX_LINKS = 5;
const MAX_SIDE = 1200;

type MyItem = ItemView & { reactions: { key: string; count: number; mine: boolean }[] };

export function MyList({ token, items }: { token: string; items: MyItem[] }) {
  const { run } = useAction();
  const [editing, setEditing] = useState<ItemView | "new" | null>(null);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gold/50 bg-card p-8 text-center">
          <p className="text-3xl" aria-hidden>
            🦌
          </p>
          <p className="mt-2 text-muted-foreground">
            Santa can&apos;t read minds (officially). Add a few ideas so your Secret Santa knows what you&apos;d love!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              token={token}
              item={item}
              footer={<Reactions token={token} itemId={item.id} initial={item.reactions} readOnly />}
              actions={
                <>
                  <Button variant="ghost" size="icon" aria-label={`Edit ${item.name}`} onClick={() => setEditing(item)}>
                    <Pencil />
                  </Button>
                  <ConfirmButton
                    title={`Remove "${item.name}"?`}
                    confirmLabel="Remove"
                    onConfirm={() => run(() => deleteItemAction(token, item.id))}
                  >
                    <Button variant="ghost" size="icon" aria-label={`Remove ${item.name}`}>
                      <Trash2 />
                    </Button>
                  </ConfirmButton>
                </>
              }
            />
          ))}
        </ul>
      )}
      <Button onClick={() => setEditing("new")} className="w-full sm:w-auto">
        <Plus /> Add a gift idea
      </Button>
      <ItemDialog token={token} editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/** Shrinks a photo to at most 1200px on its long side as a JPEG, respecting the camera's rotation. */
async function resize(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
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

async function uploadPhoto(token: string, itemId: string, file: File) {
  const { blob, width, height } = await resize(file);
  const body = new FormData();
  body.set("file", blob, "photo.jpg");
  body.set("width", String(width));
  body.set("height", String(height));
  const res = await fetch(`/p/${token}/items/${itemId}/photo`, { method: "POST", body });
  const json = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; error?: string };
  if (!json.ok) throw new Error(json.error ?? "Couldn't upload the photo");
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
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openFor, setOpenFor] = useState<typeof editing>(null);

  // Reset the form whenever the dialog opens for a different item.
  if (openFor !== editing) {
    setOpenFor(editing);
    setLinks(item?.links.length ? item.links : [""]);
    setPhoto(null);
    setRemovePhoto(false);
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
      if (photo) {
        await uploadPhoto(token, saved.itemId, photo.file).catch((err: Error) =>
          toast.error(`Saved, but the photo didn't upload: ${err.message}`),
        );
      } else if (removePhoto && item?.photoId) {
        await run(() => removePhotoAction(token, saved.itemId));
      }
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const currentPhoto = photo?.preview ?? (!removePhoto && item?.photoId ? `/p/${token}/photos/${item.photoId}` : null);

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
              Photo <span className="font-normal text-muted-foreground">optional</span>
            </Label>
            <div className="flex items-center gap-3">
              {currentPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentPhoto} alt="" className="size-20 rounded-xl border object-cover" />
              )}
              <Label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-normal hover:bg-muted sm:h-8">
                <ImagePlus className="size-4" /> {currentPhoto ? "Change photo" : "Add photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPhoto({ file, preview: URL.createObjectURL(file) });
                    e.target.value = "";
                  }}
                />
              </Label>
              {currentPhoto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhoto(null);
                    setRemovePhoto(true);
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
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
              {item ? "Save changes" : "Add to my list"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
