"use client";

import { Check, Copy, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAction } from "@/components/use-action";
import { cn } from "@/lib/utils";
import { prepareTextsAction, recordTextAction } from "./actions";

type Kind = "invite" | "reminder";
type Message = { participantId: string; name: string; to: string; body: string };

/**
 * A queue of personalized texts for the organizer to send from their own phone. Each "Text"
 * button opens the Messages app with the number and message filled in; the organizer taps Send
 * there, comes back, and moves on to the next one.
 */
export function TextQueueDialog({
  exchangeId,
  kind,
  participantIds,
  open,
  onOpenChange,
}: {
  exchangeId: string;
  kind: Kind;
  participantIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { run } = useAction();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const idsKey = participantIds.join(",");

  useEffect(() => {
    if (!open) return;
    setMessages(null);
    setDone(new Set());
    let cancelled = false;
    prepareTextsAction(exchangeId, kind, idsKey ? idsKey.split(",") : []).then((r) => {
      if (cancelled) return;
      if (r.ok) setMessages(r.data);
      else {
        toast.error(r.error);
        onOpenChange(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exchangeId, kind, idsKey]);

  function opened(m: Message) {
    setDone((d) => new Set(d).add(m.participantId));
    // Fire and forget: the Messages app is opening, so don't block on the server.
    void run(() => recordTextAction(exchangeId, m.participantId, kind));
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next && done.size) router.refresh();
  }

  const total = messages?.length ?? 0;
  const single = total === 1;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{kind === "invite" ? "Send the Nice List links" : "Santa's friendly reminders"}</DialogTitle>
          <DialogDescription>
            {single
              ? "Tap Text to open Messages with everything filled in, then hit Send."
              : "Tap Text for each person. Messages opens with everything filled in: hit Send, then come back here for the next one."}
          </DialogDescription>
        </DialogHeader>

        {!messages ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Elves are writing your messages… ✍️</p>
        ) : total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {kind === "reminder"
              ? "Everyone's all set. No reminders needed! 🎉"
              : "Nobody here has a phone number yet."}
          </p>
        ) : (
          <>
            {!single && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Opened in Messages</span>
                  <span>
                    {done.size} of {total}
                  </span>
                </div>
                <Progress value={(done.size / total) * 100} />
              </div>
            )}
            <ul className="space-y-3">
              {messages.map((m) => {
                const sent = done.has(m.participantId);
                return (
                  <li
                    key={m.participantId}
                    className={cn("space-y-2.5 rounded-xl border bg-card p-3", sent && "border-pop/40 bg-pop-soft/40")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                        {sent && <Check className="size-4 shrink-0 text-pop" aria-label="Opened" />}
                        <span className="truncate">{m.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{m.to}</span>
                    </div>
                    <p className="rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-line text-muted-foreground">
                      {m.body}
                    </p>
                    <div className="flex gap-2">
                      <Button asChild className="flex-1" variant={sent ? "outline" : "default"}>
                        <a href={smsHref(m.to, m.body)} onClick={() => opened(m)}>
                          <MessageSquareText /> {sent ? "Text again" : `Text ${m.name.split(" ")[0]}`}
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        aria-label={`Copy the message for ${m.name}`}
                        onClick={() =>
                          navigator.clipboard
                            .writeText(m.body)
                            .then(() => toast.success("Message copied"))
                            .catch(() => toast.error("Couldn't copy"))
                        }
                      >
                        <Copy /> Copy
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <DialogFooter>
          <Button variant={total > 0 && done.size === total ? "default" : "outline"} onClick={() => close(false)}>
            {total > 0 && done.size === total ? "All done! 🎉" : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** An sms: link with the message pre-filled. "?&body=" works on both iPhone and Android. */
function smsHref(to: string, body: string) {
  return `sms:${to}?&body=${encodeURIComponent(body)}`;
}
