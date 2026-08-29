import { redirect } from "next/navigation";
import { AuthServer } from "@/lib/http/auth-server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const res = await AuthServer.me();
  if (res.ok) redirect("/dashboard");

  return <LoginForm />;
}
