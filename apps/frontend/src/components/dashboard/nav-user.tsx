"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, CreditCard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { AuthClient } from "@/lib/http/auth-client";
import type { Me } from "@/lib/http/auth-server";

export function NavUser({ user }: { user: Me }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await AuthClient.logout();
    router.push("/login");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="cursor-pointer">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name ?? user.email}</span>
                  {user.name ? <span className="truncate text-xs text-muted-foreground">{user.email}</span> : null}
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="top" align="end">
            <DropdownMenuItem render={<Link href="/dashboard/billing" />}>
              <CreditCard />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={loggingOut}>
              <LogOut />
              {loggingOut ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
