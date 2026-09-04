import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthServer } from "@/lib/http/auth-server";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const res = await AuthServer.me();
  if (!res.ok || !res.data) redirect("/login");

  return (
    <DashboardShell>
      <AppSidebar user={res.data} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        {children}
      </SidebarInset>
    </DashboardShell>
  );
}
