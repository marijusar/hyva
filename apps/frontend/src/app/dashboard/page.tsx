import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerApi } from "@/lib/api-server";
import { LogoutButton } from "./logout-button";

interface Me {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default async function DashboardPage() {
  const res = await ServerApi.get<Me>("/auth/me");

  if (!res.ok || !res.data) {
    redirect("/login");
  }

  const me = res.data;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome{me.name ? `, ${me.name}` : ""}</CardTitle>
          <CardDescription>{me.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Role: {me.role}</p>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
