"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";

const SIDEBAR_PARAM = "sidebar";
const CLOSED = "closed";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = searchParams.get(SIDEBAR_PARAM) !== CLOSED;

  function handleOpenChange(next: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.delete(SIDEBAR_PARAM);
    else params.set(SIDEBAR_PARAM, CLOSED);

    // Shallow route — sidebar state is pure UI, so skip the RSC round trip.
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  return (
    <SidebarProvider open={open} onOpenChange={handleOpenChange}>
      {children}
    </SidebarProvider>
  );
}
