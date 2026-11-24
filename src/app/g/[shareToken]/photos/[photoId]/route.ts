import { guestPhotoResponse } from "@/server/guests";

// A photo on a list opened through a guest link.
export async function GET(_req: Request, { params }: { params: Promise<{ shareToken: string; photoId: string }> }) {
  const { shareToken, photoId } = await params;
  return guestPhotoResponse(shareToken, photoId);
}
