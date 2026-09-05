"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicEnv } from "./public-env-schema";

const PublicEnvContext = createContext<PublicEnv | null>(null);

export function PublicEnvProvider({ value, children }: { value: PublicEnv; children: ReactNode }) {
  return <PublicEnvContext.Provider value={value}>{children}</PublicEnvContext.Provider>;
}

export function usePublicEnvVariables(): PublicEnv {
  const ctx = useContext(PublicEnvContext);
  if (!ctx) throw new Error("usePublicEnvVariables must be used within PublicEnvProvider");
  return ctx;
}
