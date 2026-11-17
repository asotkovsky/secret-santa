"use client";

import { ArrowLeftRight, HeartHandshake, X } from "lucide-react";
import { SectionIcon } from "@/components/brand";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "@/components/use-action";
import { addExclusionAction, removeExclusionAction } from "./actions";

export function ExclusionsCard({
  exchangeId,
  people,
  pairs,
  drawn,
}: {
  exchangeId: string;
  people: { id: string; name: string }[];
  pairs: { id: string; a: string; b: string }[];
  drawn: boolean;
}) {
  const { pending, run } = useAction();
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  async function add() {
    if (await run(() => addExclusionAction(exchangeId, a, b))) {
      setA("");
      setB("");
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2.5 text-xl">
          <SectionIcon icon={HeartHandshake} tone="pop" /> Keep apart
        </CardTitle>
        <CardDescription>
          Pairs who shouldn&apos;t draw each other, like couples who already shower each other with gifts. Works both
          ways.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pairs.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {pairs.map((p) => (
              <li
                key={p.id}
                className="inline-flex items-center gap-2 rounded-full border bg-background py-1 pr-1 pl-3.5 text-sm font-medium"
              >
                {p.a} <ArrowLeftRight className="size-3.5 text-muted-foreground" aria-label="and" /> {p.b}
                {!drawn && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Let ${p.a} and ${p.b} draw each other`}
                    disabled={pending}
                    onClick={() => run(() => removeExclusionAction(exchangeId, p.id))}
                  >
                    <X />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {drawn ? (
          pairs.length === 0 && <p className="text-sm text-muted-foreground">No pairs were kept apart in this draw.</p>
        ) : people.length < 2 ? (
          <p className="text-sm text-muted-foreground">Add a few people first, then choose pairs here.</p>
        ) : (
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
            <PersonSelect people={people} value={a} onChange={setA} placeholder="Choose a person" />
            <span className="text-center text-sm text-muted-foreground">and</span>
            <PersonSelect
              people={people.filter((p) => p.id !== a)}
              value={b}
              onChange={setB}
              placeholder="Choose a person"
            />
            <Button variant="outline" disabled={!a || !b || pending} onClick={add}>
              Keep them apart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PersonSelect({
  people,
  value,
  onChange,
  placeholder,
}: {
  people: { id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {people.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
