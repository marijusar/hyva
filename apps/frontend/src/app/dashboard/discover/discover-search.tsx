"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StoreFollowButton } from "@/components/store/store-follow-button";
import { searchStores } from "@/lib/actions/store-search";
import { useDebouncedFn } from "@/hooks/use-debounced-fn";
import type { StoreSearchResult } from "@/lib/http/store-server";

const DEBOUNCE_MS = 350;

export function DiscoverSearch({
  initialQuery,
  initialResults,
}: {
  initialQuery: string;
  initialResults: StoreSearchResult[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebouncedFn(async (value: string) => {
    const res = await searchStores(value);
    setResults(res.data);
    setLoading(false);
  }, DEBOUNCE_MS);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debouncedSearch(value);
  }

  return (
    <div className="flex flex-col gap-6">
      <Input
        value={query}
        onChange={handleChange}
        placeholder="Search by domain, name, or technology…"
        autoFocus
        className="h-11 text-base"
      />

      {!query.trim() ? (
        <p className="text-sm text-muted-foreground">Type a store domain, name, or technology to search.</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Searching…</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stores match &quot;{query}&quot;.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((store) => (
            <Card key={store.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Link href={`/dashboard/${store.id}`} className="font-medium underline-offset-4 hover:underline">
                    {store.name ?? store.domain}
                  </Link>
                  <span className="text-sm text-muted-foreground">{store.domain}</span>
                  {store.matched_technologies.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {store.matched_technologies.map((name) => (
                        <Badge key={name} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <StoreFollowButton storeId={store.id} domain={store.domain} initialIsSubscribed={store.is_subscribed} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
