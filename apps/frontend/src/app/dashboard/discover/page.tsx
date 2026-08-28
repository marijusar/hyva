import Link from "next/link";
import { StoreServer } from "@/lib/http/store-server";
import { DiscoverSearch } from "./discover-search";

export default async function DiscoverPage({ searchParams }: PageProps<"/dashboard/discover">) {
  const params = await searchParams;
  const rawQ = params.q;
  const q = (typeof rawQ === "string" ? rawQ : "").trim();

  const res = q ? await StoreServer.search(q) : null;
  const initialResults = res?.ok && res.data ? res.data : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discover stores</h1>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          ← Your stores
        </Link>
      </div>

      <DiscoverSearch initialQuery={q} initialResults={initialResults} />
    </div>
  );
}
