"use client";

import { Copy, MessageSquareText, MoreVertical, Pencil, RefreshCw, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionIcon } from "@/components/brand";
import { ConfirmDialog } from "@/components/confirm-button";
import { Field, PhoneField } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formObject, useAction } from "@/components/use-action";
import { cn } from "@/lib/utils";
import { addParticipantAction, removeParticipantAction, resetLinkAction, updateParticipantAction } from "./actions";
import { TextQueueDialog } from "./text-queue";

export type PersonRow = {
  id: string;
  name: string;
  phone: string | null;
  token: string;
  isOrganizer: boolean;
  /** False for a gift helper: not in the draw, no wish list, but shops from everyone's lists. */
  inDraw: boolean;
  invitedAt: string | null;
  revealed: boolean;
  itemCount: number;
  needsReminder: boolean;
};

export function PeopleCard({ exchangeId, people, drawn }: { exchangeId: string; people: PersonRow[]; drawn: boolean }) {
  const [editing, setEditing] = useState<PersonRow | "new" | null>(null);

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2.5 text-xl">
            <SectionIcon icon={Users} /> The list ({people.length})
          </CardTitle>
          <CardDescription>
            {drawn
              ? "Names are drawn, so the draw is locked. You can still add gift helpers (like grandparents) who shop but aren't in the draw."
              : "Everyone who's taking part, with a mobile number so you can text them their link. Add gift helpers (like grandparents) who shop but aren't in the draw."}
          </CardDescription>
        </div>
        <Button onClick={() => setEditing("new")} className="w-full sm:w-auto">
          <UserPlus /> {drawn ? "Add gift helper" : "Add person"}
        </Button>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
          <p className="rounded-xl bg-muted/60 py-8 text-center text-sm text-muted-foreground">
            The list is empty. Even Santa starts somewhere. Add the first person!
          </p>
        ) : (
          <ul className="divide-y">
            {people.map((p) => (
              <PersonItem key={p.id} exchangeId={exchangeId} person={p} drawn={drawn} onEdit={() => setEditing(p)} />
            ))}
          </ul>
        )}
      </CardContent>
      <PersonDialog exchangeId={exchangeId} editing={editing} drawn={drawn} onClose={() => setEditing(null)} />
    </Card>
  );
}

function PersonItem({
  exchangeId,
  person: p,
  drawn,
  onEdit,
}: {
  exchangeId: string;
  person: PersonRow;
  drawn: boolean;
  onEdit: () => void;
}) {
  const { run } = useAction();
  const [confirm, setConfirm] = useState<"remove" | "relink" | null>(null);
  const [texting, setTexting] = useState(false);

  function copyLink() {
    navigator.clipboard
      .writeText(`${window.location.origin}/p/${p.token}`)
      .then(() => toast.success(`Copied ${p.name}'s link`))
      .catch(() => toast.error("Couldn't copy the link"));
  }

  return (
    <li className="flex items-start gap-2 py-3.5">
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{p.name}</span>
            {p.isOrganizer && <Badge variant="outline">You · Head Elf</Badge>}
            {!p.inDraw && <Badge variant="secondary">Gift helper</Badge>}
          </div>
          <div className={cn("text-sm whitespace-nowrap", p.phone ? "text-muted-foreground" : "text-destructive/80")}>
            {p.phone ?? "No phone number"}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {[
              !p.inDraw && "Not in the draw, just shopping",
              p.inDraw && (p.itemCount ? `${p.itemCount} ${p.itemCount === 1 ? "idea" : "ideas"} on their list` : "No wish list yet"),
              p.inDraw && drawn && (p.revealed ? "saw their match" : "hasn't seen their match"),
              p.invitedAt ? "link texted" : "link not texted yet",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Options for ${p.name}`} className="-mr-2">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem disabled={!p.phone} onSelect={() => setTexting(true)}>
            <MessageSquareText /> Text {p.name} their link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={copyLink}>
            <Copy /> Copy their link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit {p.name}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirm("relink")}>
            <RefreshCw /> Replace their link
          </DropdownMenuItem>
          {(!drawn || !p.inDraw) && (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("remove")}>
              <Trash2 /> Remove {p.name}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirm === "remove"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Remove ${p.name}?`}
        description={
          p.inDraw
            ? "Their wish list will be deleted too."
            : "Anything they marked as bought goes back on the lists."
        }
        confirmLabel="Remove"
        onConfirm={() => run(() => removeParticipantAction(exchangeId, p.id), `Removed ${p.name}`)}
      />
      <ConfirmDialog
        open={confirm === "relink"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Replace ${p.name}'s link?`}
        description="Their old link stops working right away. Use this if a link was forwarded by mistake, then text them the new one."
        confirmLabel="Replace link"
        destructive={false}
        onConfirm={() => run(() => resetLinkAction(exchangeId, p.id), "New link ready. Text it to them from the menu.")}
      />
      <TextQueueDialog
        exchangeId={exchangeId}
        kind="invite"
        participantIds={[p.id]}
        open={texting}
        onOpenChange={setTexting}
      />
    </li>
  );
}

function PersonDialog({
  exchangeId,
  editing,
  drawn,
  onClose,
}: {
  exchangeId: string;
  editing: PersonRow | "new" | null;
  drawn: boolean;
  onClose: () => void;
}) {
  const { pending, run } = useAction();
  const isNew = editing === "new";
  const person = editing && editing !== "new" ? editing : null;
  const [added, setAdded] = useState<string[]>([]);
  const [helper, setHelper] = useState(false);
  const [openFor, setOpenFor] = useState<typeof editing>(null);

  // Reset the switch whenever the dialog opens for a different person.
  if (openFor !== editing) {
    setOpenFor(editing);
    // After the draw, only gift helpers can be added.
    setHelper(person ? !person.inDraw : drawn);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const { name, phone } = formObject(form);
    const input = { name, phone, inDraw: helper ? "off" : "on" };
    if (isNew) {
      if (await run(() => addParticipantAction(exchangeId, input), `Added ${name} 🎉`)) {
        // Stay open so the next person can be added straight away.
        setAdded((a) => [...a, name]);
        form.reset();
        setHelper(drawn);
        form.querySelector<HTMLInputElement>("input[name=name]")?.focus();
      }
    } else if (person) {
      if (await run(() => updateParticipantAction(exchangeId, person.id, input), "Saved")) onClose();
    }
  }

  function close() {
    setAdded([]);
    onClose();
  }

  return (
    <Dialog open={editing !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? (drawn ? "Add a gift helper" : "Add to the Nice List") : `Edit ${person?.name}`}</DialogTitle>
          {isNew && (
            <DialogDescription>
              {added.length
                ? `Added ${added.join(", ")}. Add the next one, or tap Done.`
                : "One person at a time. Santa likes to be thorough."}
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5" key={person?.id ?? "new"}>
          <Field name="name" label="Name" required maxLength={80} autoComplete="off" defaultValue={person?.name} />
          <PhoneField
            name="phone"
            label="Mobile number"
            optional
            placeholder="555-555-5555"
            hint="Used to text them their personal link."
            defaultValue={person?.phone ?? ""}
          />
          <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/40 p-3">
            <div className="space-y-1">
              <Label htmlFor="helper">🎁 Gift helper</Label>
              <p className="text-xs text-muted-foreground">
                {drawn
                  ? isNew
                    ? "Names are already drawn, so new people join as gift helpers: not in the draw and no wish list, but they can browse everyone's lists and mark what they buy."
                    : "Can't change after names are drawn. Reset the draw first."
                  : "Not in the name draw and no wish list, but can browse everyone's lists and mark what they buy. Great for grandparents."}
              </p>
            </div>
            <Switch id="helper" checked={helper} onCheckedChange={setHelper} disabled={drawn} className="mt-0.5" />
          </div>
          {person && person.inDraw && helper && (
            <p className="text-xs text-destructive">
              Saving removes their wish list and any &ldquo;keep apart&rdquo; pairs they&apos;re in.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              {isNew ? "Done" : "Cancel"}
            </Button>
            <Button type="submit" disabled={pending}>
              {isNew ? (drawn ? "Add gift helper" : "Add person") : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
