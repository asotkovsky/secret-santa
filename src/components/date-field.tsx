"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * An optional date with a "Clear" button. Browsers' date pickers give no obvious way to remove a
 * date once it's set, which made optional dates effectively permanent.
 */
export function OptionalDateField({
  name,
  label,
  hint,
  defaultValue,
  className,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const id = `f-${name}`;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="-my-1 inline-flex items-center gap-0.5 rounded px-1 py-1 text-xs font-medium text-muted-foreground hover:text-brand"
          >
            <X className="size-3" /> Clear
          </button>
        )}
      </div>
      <Input id={id} name={name} type="date" value={value} onChange={(e) => setValue(e.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
