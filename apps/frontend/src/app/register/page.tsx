import { redirect } from "next/navigation";
import { AuthServer } from "@/lib/http/auth-server";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const res = await AuthServer.me();
  if (res.ok) redirect("/dashboard");

  return <RegisterForm />;
}
