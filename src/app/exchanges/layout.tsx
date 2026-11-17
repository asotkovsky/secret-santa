import { SiteFooter, SiteHeader } from "@/components/brand";
import { requireUser } from "@/lib/access";
import { SignOutButton } from "./sign-out-button";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <SiteHeader href="/exchanges">
        <span className="hidden text-white/80 sm:inline">{user.name}</span>
        <SignOutButton />
      </SiteHeader>
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-8 sm:px-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
