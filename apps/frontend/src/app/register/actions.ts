"use server";

import { redirect } from "next/navigation";
import { AuthServer } from "@/lib/http/auth-server";
import { formValue } from "@/lib/utils";
import {
  ServerActionResponse,
  ServerActionResponsePayload,
  ServerActionStatuses,
} from "@/lib/responses/server-action-response";

export async function register(
  _prevState: ServerActionResponsePayload<null>,
  formData: FormData,
): Promise<ServerActionResponsePayload<null>> {
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  const registerRes = await AuthServer.register(email, password);
  if (!registerRes.ok) {
    return ServerActionResponse.create({
      data: null,
      error: registerRes.data?.error ?? "Registration failed",
      status: ServerActionStatuses.error,
    });
  }

  const loginRes = await AuthServer.login(email, password);
  if (!loginRes.ok) {
    redirect("/login");
  }

  redirect("/dashboard");
}
