import { findParticipant } from "@/lib/access";
import { photoResponse } from "@/server/wishlists";

// A wish-list photo, for anyone in the same exchange.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; photoId: string }> }) {
  const { token, photoId } = await params;
  const ctx = await findParticipant(token);
  if (!ctx) return new Response("Not found", { status: 404 });
  return photoResponse(ctx, photoId);
}
