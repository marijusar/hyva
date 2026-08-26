import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreServer } from "@/lib/http/store-server";

export default async function StoreDetailPage({ params }: PageProps<"/dashboard/[storeId]">) {
  const { storeId } = await params;
  const res = await StoreServer.getSubscription(storeId);

  if (!res.ok || !res.data) notFound();

  const store = res.data;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Back to stores
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{store.name ?? store.domain}</h1>
        <p className="text-sm text-muted-foreground">{store.domain}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-48">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Platform</CardTitle>
          </CardHeader>
          <CardContent>{store.platform ?? "Unknown"}</CardContent>
        </Card>
        <Card className="flex-1 min-w-48">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Last crawl</CardTitle>
          </CardHeader>
          <CardContent>
            {store.last_crawl_status ? <Badge variant="outline">{store.last_crawl_status}</Badge> : "—"}
            {store.last_crawled_at ? (
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(store.last_crawled_at).toLocaleString()}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Technologies</CardTitle>
        </CardHeader>
        <CardContent>
          {store.technologies.length === 0 ? (
            <p className="text-sm text-muted-foreground">None detected yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {store.technologies.map((tech) => (
                <Badge key={tech.name} variant="secondary">
                  {tech.name}
                  {tech.category ? ` · ${tech.category}` : ""}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homepage text</CardTitle>
        </CardHeader>
        <CardContent>
          {store.homepage_text ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{store.homepage_text}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No homepage text captured yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
