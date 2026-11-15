"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle(callbackUrl: string) {
  await signIn("google", { redirectTo: callbackUrl || "/app" });
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/app");
  await signIn("resend", { email, redirectTo: callbackUrl });
}
