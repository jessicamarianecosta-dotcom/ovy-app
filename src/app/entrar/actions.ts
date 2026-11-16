"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

function errorUrl(mode: "entrar" | "cadastro", message: string) {
  const url = new URL("/entrar", "http://localhost");
  if (mode === "cadastro") url.searchParams.set("cadastro", "");
  url.searchParams.set("erro", message);
  return url.pathname + url.search;
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/app");
  await signIn("resend", { email, redirectTo: callbackUrl });
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/app");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(errorUrl("entrar", "E-mail ou senha incorretos."));
    }
    throw error;
  }
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "").trim();
  const callbackUrl = String(formData.get("callbackUrl") || "/app");

  if (!email || !password || password.length < 6) {
    redirect(errorUrl("cadastro", "Preencha e-mail e uma senha com pelo menos 6 caracteres."));
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing?.passwordHash) {
    redirect(errorUrl("cadastro", "Já existe uma conta com esse e-mail. Faça login."));
  }

  if (existing) {
    // Conta criada antes só por link mágico: define a senha agora, sem duplicar usuário.
    const passwordHash = await bcrypt.hash(password, 10);
    await db
      .update(users)
      .set({ passwordHash, phone: phone || existing.phone })
      .where(eq(users.id, existing.id));
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      phone: phone || null,
      passwordHash,
    });
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(errorUrl("entrar", "Conta criada! Faça login com sua senha."));
    }
    throw error;
  }
}
