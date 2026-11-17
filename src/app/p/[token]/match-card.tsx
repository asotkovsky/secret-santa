"use client";

import confetti from "canvas-confetti";
import { Fingerprint } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuditTicker } from "@/components/audit-ticker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAction } from "@/components/use-action";
import { pick, REDRAW_DENIALS } from "@/lib/jokes";
import { cn } from "@/lib/utils";
import { revealAction } from "./actions";

type Match = { id: string; name: string };
type Stage = "secret" | "auditing" | "revealed";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function MatchCard({ token, drawn, match: initial }: { token: string; drawn: boolean; match: Match | null }) {
  const { run } = useAction();
  const [match, setMatch] = useState(initial);
  const [stage, setStage] = useState<Stage>(initial ? "revealed" : "secret");

  async function reveal() {
    setStage("auditing");
    // A short "audit" for a beat of suspense, however fast the server is.
    const [result] = await Promise.all([run(() => revealAction(token)), wait(2400)]);
    if (!result) return setStage("secret");
    setMatch(result);
    setStage("revealed");
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.35 },
      colors: ["#c8102e", "#1b5e3b", "#d9a521", "#ffffff"],
    });
  }

  if (!drawn) {
    return (
      <Present>
        <p className="text-4xl" aria-hidden>
          ⏳
        </p>
        <h2 className="text-xl font-bold sm:text-2xl">Names haven&apos;t been drawn yet</h2>
        <p className="text-sm text-muted-foreground">
          Santa&apos;s still shaking the hat. You&apos;ll find out here who you&apos;re buying for. Start your wish list
          in the meantime!
        </p>
      </Present>
    );
  }

  if (stage === "secret") {
    return (
      <Present>
        <span className="inline-block -rotate-3 rounded-md border-2 border-brand px-3 py-1 text-xs font-black tracking-[0.25em] text-brand uppercase">
          Top secret
        </span>
        <h2 className="text-xl font-bold sm:text-2xl">Names have been drawn</h2>
        <p className="text-sm text-muted-foreground">
          Keep away from nosy siblings and peeking parents. When the coast is clear, press and hold to reveal.
        </p>
        <HoldToReveal onDone={reveal} />
      </Present>
    );
  }

  if (stage === "auditing") {
    return (
      <Present>
        <AuditTicker />
      </Present>
    );
  }

  return (
    <Present>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Your mission this year</p>
      <h2 className="animate-in font-display text-4xl font-semibold text-brand italic duration-500 zoom-in-50 sm:text-5xl">
        {match!.name}
      </h2>
      <p className="text-sm text-muted-foreground">You&apos;re their Secret Santa. Act natural. 🤫</p>
      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href={`/p/${token}/lists/${match!.id}`}>See {match!.name}&apos;s wish list →</Link>
      </Button>
      <RedrawPrank />
    </Present>
  );
}

/** Press and hold for ~1.2s to reveal, with a filling ring. Keyboard: hold Space or Enter. */
function HoldToReveal({ onDone }: { onDone: () => void }) {
  const DURATION = 1200;
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const frame = useRef(0);

  function begin() {
    if (start.current !== null) return;
    start.current = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start.current!) / DURATION);
      setProgress(p);
      if (p >= 1) {
        start.current = null;
        navigator.vibrate?.(40);
        onDone();
      } else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  function cancel() {
    cancelAnimationFrame(frame.current);
    start.current = null;
    setProgress(0);
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <button
        type="button"
        aria-label="Press and hold to reveal your match"
        className="relative grid size-24 touch-none place-items-center rounded-full select-none [-webkit-touch-callout:none]"
        style={{ background: `conic-gradient(var(--brand) ${progress * 360}deg, var(--muted) 0deg)` }}
        onPointerDown={begin}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            begin();
          }
        }}
        onKeyUp={cancel}
      >
        <span
          className={cn(
            "grid size-21 place-items-center rounded-full bg-card transition-colors",
            progress > 0 ? "text-brand" : "text-muted-foreground",
          )}
        >
          <Fingerprint className="size-11" strokeWidth={1.5} />
        </span>
      </button>
      <span className="text-xs font-medium text-muted-foreground">
        {progress > 0 ? "Scanning… keep holding" : "Press and hold"}
      </span>
    </div>
  );
}

/** A tiny "Request a redraw" link that North Pole HR always denies. */
function RedrawPrank() {
  const [denial, setDenial] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className="block w-full pt-2 text-[11px] text-muted-foreground/70 underline-offset-2 hover:underline"
        onClick={() => setDenial(pick(REDRAW_DENIALS))}
      >
        Request a redraw
      </button>
      <Dialog open={denial !== null} onOpenChange={(o) => !o && setDenial(null)}>
        <DialogContent className="text-center">
          <DialogHeader className="items-center text-center">
            <p className="text-4xl" aria-hidden>
              🙅
            </p>
            <DialogTitle className="text-xl">Request denied</DialogTitle>
            <DialogDescription className="text-base">{denial}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setDenial(null)}>Fine. 🙄</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A wrapped present: red paper, gold ribbon, and a gift tag in the middle for the content. */
function Present({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-present p-5 shadow-lg sm:p-8">
      <div className="mx-auto max-w-md space-y-3 rounded-2xl bg-card p-6 text-center shadow-md sm:p-8">{children}</div>
    </section>
  );
}
