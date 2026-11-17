import { SiteHeader } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="flex justify-center px-4 pt-12 pb-10">{children}</main>
    </div>
  );
}
