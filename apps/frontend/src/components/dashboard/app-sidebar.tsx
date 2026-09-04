import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import type { Me } from "@/lib/http/auth-server";

export function AppSidebar({ user }: { user: Me }) {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <span className="font-[family-name:var(--font-fraunces)] text-lg">Hyva</span>
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
