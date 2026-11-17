import { EyeOff, HeartHandshake, ListChecks, MessageSquareText, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo, SectionIcon, SiteFooter } from "@/components/brand";
import { NiceBadge } from "@/components/nice-badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/access";
import { niceStatus } from "@/lib/nice";

const FEATURES: { icon: LucideIcon; tone: "brand" | "pop" | "gold"; title: string; body: string }[] = [
  { icon: Sparkles, tone: "gold", title: "Names from Santa's hat", body: "A fair, random draw, done in one tap." },
  {
    icon: HeartHandshake,
    tone: "pop",
    title: "Couples kept apart",
    body: "Mom and Dad already buy for each other. Sorted.",
  },
  { icon: ListChecks, tone: "brand", title: "Wish lists", body: "Photos, links and notes. Hints, but in writing." },
  { icon: EyeOff, tone: "pop", title: "Secret shopping", body: "Mark it bought. Everyone knows except the recipient." },
  {
    icon: MessageSquareText,
    tone: "brand",
    title: "No passwords",
    body: "Everyone gets a personal link by text. Tap and go.",
  },
];

export default async function Home() {
  if (await getSession()) redirect("/exchanges");

  return (
    <div className="min-h-dvh">
      <section className="relative bg-pine-deep bg-snowflakes-light text-white">
        <div className="h-1 candy-stripe" />
        <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Logo light />
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </header>
        <div className="mx-auto max-w-2xl space-y-6 px-4 pt-12 pb-20 text-center sm:px-6 md:pt-20 md:pb-28">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">Secret Santa, sorted</p>
          <h1 className="text-[2.6rem] leading-[1.05] font-semibold sm:text-6xl">
            Making a list.
            <br />
            <span className="text-gold italic">Checking it twice.</span>
          </h1>
          <p className="mx-auto max-w-md text-lg text-white/80">
            Draw names, share wish lists and keep the surprise, without a single family group chat meltdown.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button asChild className="h-12 w-full max-w-xs px-6 text-base sm:w-auto">
              <Link href="/sign-up">Start your Nice List</Link>
            </Button>
            <p className="text-sm text-white/70">Got a link by text? Just open it. No account needed.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <NiceBadge status={niceStatus(true, 3, true)} />
            <NiceBadge status={niceStatus(true, 3, false)} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 -bottom-[18px] bg-lights" aria-hidden />
      </section>

      <section className="mx-auto grid max-w-5xl gap-3 px-4 pt-14 pb-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-4 rounded-2xl border bg-card p-5">
            <SectionIcon icon={f.icon} tone={f.tone} />
            <div className="space-y-1">
              <h2 className="font-sans text-base font-semibold">{f.title}</h2>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          </div>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
