"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Store } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Your stores",
    icon: Store,
    // Store detail pages (/dashboard/<id>) belong to this section.
    match: (path: string) => path === "/dashboard" || /^\/dashboard\/(?!discover|billing)/.test(path),
  },
  {
    href: "/dashboard/discover",
    label: "Discover",
    icon: Search,
    match: (path: string) => path.startsWith("/dashboard/discover"),
  },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton isActive={item.match(pathname)} render={<Link href={item.href} />}>
            <item.icon />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
