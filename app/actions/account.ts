"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * A real delete, not a flag. Removing the auth user cascades through every
 * table that references it, which the migration's foreign keys guarantee and
 * the RLS suite checks.
 */
export async function deleteAccount(confirmation: string) {
  if (confirmation.trim().toLowerCase() !== "delete") {
    return { error: "Type delete to confirm." };
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  try {
    const admin = supabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return { error: "Couldn’t delete the account just now. Try again, or email us." };
  } catch {
    return {
      error:
        "Account deletion isn’t configured on this deployment. SUPABASE_SERVICE_ROLE_KEY is missing.",
    };
  }

  await supabase.auth.signOut();
  redirect("/sign-in?deleted=1");
}
