import Link from "next/link";
import { requireUser } from "@/lib/access";
import { NewExchangeForm } from "./new-exchange-form";

export const metadata = { title: "New exchange" };

export default async function NewExchangePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link href="/exchanges" className="text-sm text-muted-foreground hover:underline">
          ← Your exchanges
        </Link>
        <h1 className="text-3xl font-bold">Start a Nice List</h1>
        <p className="text-muted-foreground">Only the name is required. You can change everything later.</p>
      </div>
      <NewExchangeForm organizerName={user.name} />
    </div>
  );
}
