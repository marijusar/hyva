"use server";

import { redirect } from "next/navigation";
import { AuthServer } from "@/lib/http/auth-server";
import { formValue } from "@/lib/utils";
import {
  ServerActionResponse,
  ServerActionResponsePayload,
  ServerActionStatuses,
} from "@/lib/responses/server-action-response";

export async function login(
  _prevState: ServerActionResponsePayload<null>,
  formData: FormData,
): Promise<ServerActionResponsePayload<null>> {
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  const res = await AuthServer.login(email, password);

  if (!res.ok) {
    return ServerActionResponse.create({
      data: null,
      error: res.error ?? "Login failed",
      status: ServerActionStatuses.error,
    });
  }

  redirect("/dashboard");
}
