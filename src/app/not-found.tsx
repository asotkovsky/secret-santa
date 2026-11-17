import Link from "next/link";
import { SiteHeader } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 pt-20 text-center">
        <p className="text-5xl" aria-hidden>
          🧦
        </p>
        <h1 className="text-2xl font-bold">This link is on the naughty list</h1>
        <p className="text-muted-foreground">
          If it came in a text, it may have been replaced with a new one. Ask your organizer (the Head Elf) to text you
          a fresh link.
        </p>
        <Link href="/" className="text-sm underline">
          Go to the home page
        </Link>
      </main>
    </div>
  );
}
