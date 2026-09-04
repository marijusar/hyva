import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrawlStatusBadge } from "@/components/store/crawl-status-badge";
import { StoreServer } from "@/lib/http/store-server";

export default async function DashboardPage() {
  const res = await StoreServer.listSubscriptions();

  if (res.status === 401) redirect("/login");
  if (res.status === 402) redirect("/dashboard/billing");
  if (!res.ok || !res.data) redirect("/login");

  const subscriptions = res.data;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Your stores</h1>

      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Last crawl</TableHead>
              <TableHead>Technologies</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((store) => (
              <TableRow key={store.id} className="relative cursor-pointer">
                <TableCell>
                  <Link
                    href={`/dashboard/${store.id}`}
                    className="font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                  >
                    {store.name ?? store.domain}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {store.domain}
                  </div>
                </TableCell>
                <TableCell>{store.platform ?? "—"}</TableCell>
                <TableCell>
                  {store.last_crawl_status ? (
                    <CrawlStatusBadge status={store.last_crawl_status} />
                  ) : (
                    "—"
                  )}
                  {store.last_crawled_at ? (
                    <div className="text-xs text-muted-foreground">
                      {new Date(store.last_crawled_at).toLocaleString()}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>{store.technologies.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
