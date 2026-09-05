import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import type { Me } from "@/lib/http/auth-server";

export function AppSidebar({ user }: { user: Me }) {
  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center gap-2 px-4 py-3">
        <Logo className="h-5 w-auto text-foreground" />
        <span className="font-[family-name:var(--font-fraunces)] text-lg">Sorrel</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMain />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
