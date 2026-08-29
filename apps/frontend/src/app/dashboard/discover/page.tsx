import Link from "next/link";
import { StoreServer } from "@/lib/http/store-server";
import { DiscoverSearch } from "./discover-search";
import z from "zod";

const querySchema = z.string();

const DiscoverSearchBar = async ({
  searchParams,
}: PageProps<"/dashboard/discover">) => {
  const params = await searchParams;
  const { data, success } = querySchema.safeParse(params.q);

  if (!success) {
    return <DiscoverSearch initialQuery="" initialResults={[]} />;
  }

  const res = await StoreServer.search(data);
  const initialResults = res?.ok && res.data ? res.data : [];

  return <DiscoverSearch initialQuery={data} initialResults={initialResults} />;
};

export default async function DiscoverPage(
  props: PageProps<"/dashboard/discover">,
) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discover stores</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Your stores
        </Link>
      </div>

      <DiscoverSearchBar {...props} />
    </div>
  );
}
