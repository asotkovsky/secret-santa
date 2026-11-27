import { revalidatePath } from "next/cache";
import { findParticipant } from "@/lib/access";
import { UserError } from "@/server/core";
import { addItemPhoto } from "@/server/wishlists";

// Add a photo to one of your own items (multipart: file, width, height). A route handler
// rather than a server action, whose request size limit is too small for photos.
export async function POST(req: Request, { params }: { params: Promise<{ token: string; itemId: string }> }) {
  const { token, itemId } = await params;
  const ctx = await findParticipant(token);
  if (!ctx) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new UserError("Choose a photo to upload.");
    const result = await addItemPhoto(ctx, itemId, {
      data: Buffer.from(await file.arrayBuffer()),
      width: Number(form.get("width")),
      height: Number(form.get("height")),
    });
    revalidatePath(`/p/${token}`, "layout");
    return Response.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof UserError) return Response.json({ ok: false, error: e.message }, { status: 400 });
    throw e;
  }
}
