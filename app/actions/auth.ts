"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export type SignInState = { error?: string; sent?: string };

export async function sendMagicLink(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That doesn’t look like an email address. Have another go." };
  }

  const supabase = await supabaseServer();
  const redirectTo = new URL("/auth/callback", siteUrl());
  if (next) redirectTo.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo.toString() },
  });

  if (error) {
    return {
      error:
        error.status === 429
          ? "That’s a few links in a row. Give it a minute and try again."
          : "Something went wrong sending that. Try again in a moment.",
    };
  }

  return { sent: email };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
