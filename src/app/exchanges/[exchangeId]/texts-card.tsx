"use client";

import { BellRing, MessageSquareText, Send } from "lucide-react";
import { SectionIcon } from "@/components/brand";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonRow } from "./people-card";
import { TextQueueDialog } from "./text-queue";

type TextRow = { id: string; name: string; kind: string; at: string };

export function TextsCard({
  exchangeId,
  people,
  texts,
}: {
  exchangeId: string;
  people: PersonRow[];
  texts: TextRow[];
}) {
  const [queue, setQueue] = useState<{ kind: "invite" | "reminder"; ids: string[] } | null>(null);
  const withPhone = people.filter((p) => p.phone);
  const notInvited = withPhone.filter((p) => !p.invitedAt);
  const toRemind = withPhone.filter((p) => p.needsReminder);
  const noPhone = people.length - withPhone.length;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2.5 text-xl">
          <SectionIcon icon={MessageSquareText} /> Texts from the North Pole
        </CardTitle>
        <CardDescription>
          Texts come from your own phone, so do this signed in on your phone. Each message opens in Messages with the
          person&apos;s link filled in, ready to send.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button
            disabled={!notInvited.length}
            onClick={() => setQueue({ kind: "invite", ids: notInvited.map((p) => p.id) })}
          >
            <Send /> {notInvited.length ? `Text links (${notInvited.length} to send)` : "Everyone has their link"}
          </Button>
          <Button
            variant="outline"
            disabled={!toRemind.length}
            onClick={() => setQueue({ kind: "reminder", ids: toRemind.map((p) => p.id) })}
          >
            <BellRing /> {toRemind.length ? `Send reminders (${toRemind.length})` : "No reminders needed"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Reminders only go to people who still need to see their match or start their wish list.
        </p>
        {noPhone > 0 && (
          <p className="text-sm text-muted-foreground">
            {noPhone} {noPhone === 1 ? "person has" : "people have"} no phone number. Copy their link from the ⋮ menu
            and send it another way.
          </p>
        )}

        {texts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-sans text-sm font-semibold">Recent texts</h3>
            <ul className="divide-y rounded-lg border text-sm">
              {texts.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>
                    {t.kind === "invite" ? "Link" : "Reminder"} to <span className="font-medium">{t.name}</span>
                  </span>
                  <time dateTime={t.at} className="text-muted-foreground">
                    {new Date(t.at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <TextQueueDialog
        exchangeId={exchangeId}
        kind={queue?.kind ?? "invite"}
        participantIds={queue?.ids ?? []}
        open={queue !== null}
        onOpenChange={(o) => !o && setQueue(null)}
      />
    </Card>
  );
}
