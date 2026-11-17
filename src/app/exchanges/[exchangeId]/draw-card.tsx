"use client";

import { Eye, EyeOff, Shuffle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useState } from "react";
import { AuditTicker } from "@/components/audit-ticker";
import { SectionIcon } from "@/components/brand";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAction } from "@/components/use-action";
import { formatDay } from "@/lib/format";
import { drawAction, peekAction, resetDrawAction } from "./actions";

export function DrawCard({
  exchangeId,
  drawnAt,
  count,
  revealedCount,
  organizerIsParticipant,
}: {
  exchangeId: string;
  drawnAt: string | null;
  count: number;
  revealedCount: number;
  organizerIsParticipant: boolean;
}) {
  const { pending, run } = useAction();
  const [peek, setPeek] = useState<{ giver: string; receiver: string }[] | null>(null);
  const [drawing, setDrawing] = useState(false);

  async function drawNames() {
    setDrawing(true);
    // Let the audit play for a few seconds, however fast the draw is.
    const [result] = await Promise.all([
      run(() => drawAction(exchangeId), "Names drawn! Everyone passed the audit. 🎉"),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
    setDrawing(false);
    if (result)
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.4 },
        colors: ["#c8102e", "#1b5e3b", "#d9a521", "#ffffff"],
      });
  }

  async function reveal() {
    const rows = await run(() => peekAction(exchangeId));
    if (rows) setPeek(rows);
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2.5 text-xl">
          <SectionIcon icon={Sparkles} tone="gold" /> Draw names
        </CardTitle>
        <CardDescription>
          {drawnAt
            ? `Names were drawn on ${formatDay(drawnAt.slice(0, 10), "MMM d")}. Everyone sees who they got by opening their link and tapping Reveal.`
            : "Once everyone's on the list, pull names from Santa's hat. Nobody sees who they got until they open their own link."}
        </CardDescription>
      </CardHeader>
      <Dialog open={drawing}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Drawing names</DialogTitle>
          <p className="text-center text-4xl" aria-hidden>
            🎩
          </p>
          <AuditTicker title="Shaking Santa's hat" />
        </DialogContent>
      </Dialog>
      <CardContent className="space-y-5">
        {!drawnAt ? (
          <ConfirmButton
            title="Pull names from Santa's hat? 🎩"
            description={`All ${count} people will get someone to buy for. After this, adding or removing people means resetting the draw.`}
            confirmLabel="Draw names"
            destructive={false}
            onConfirm={drawNames}
          >
            <Button disabled={count < 3 || pending} className="w-full sm:w-auto">
              <Shuffle /> Draw names
            </Button>
          </ConfirmButton>
        ) : (
          <>
            <div className="max-w-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>Have seen their match</span>
                <span className="font-medium">
                  {revealedCount} of {count}
                </span>
              </div>
              <Progress value={count ? (revealedCount / count) * 100 : 0} />
            </div>

            {peek ? (
              <div className="space-y-3">
                <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                  {peek.map((r) => (
                    <li key={r.giver} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                      <span className="font-medium">{r.giver}</span>
                      <span className="text-muted-foreground">gives to</span>
                      <span className="font-medium">{r.receiver}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" onClick={() => setPeek(null)}>
                  <EyeOff /> Hide matches
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <ConfirmButton
                  title="Peek like a nosy elf? 👀"
                  description={
                    organizerIsParticipant
                      ? "This shows who's buying for whom, including who has you. No unseeing it!"
                      : "This shows who is buying for whom."
                  }
                  confirmLabel="Show me"
                  destructive={false}
                  onConfirm={reveal}
                >
                  <Button variant="outline" disabled={pending}>
                    <Eye /> Peek at matches
                  </Button>
                </ConfirmButton>
                <ConfirmButton
                  title="Throw the names back in the hat?"
                  description="Everyone's match is erased and you'll draw again. Anyone who already looked will get someone new, so give them a heads-up. Wish lists stay as they are."
                  confirmLabel="Reset draw"
                  onConfirm={() => run(() => resetDrawAction(exchangeId), "Draw reset")}
                >
                  <Button variant="ghost" disabled={pending}>
                    Reset draw
                  </Button>
                </ConfirmButton>
              </div>
            )}
          </>
        )}
        {!drawnAt && count < 3 && <p className="text-sm text-muted-foreground">Add at least 3 people to draw names.</p>}
      </CardContent>
    </Card>
  );
}
