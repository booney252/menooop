"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function clearChat() {
  const supabase = await supabaseServer();
  await supabase.from("chat_messages").delete().not("id", "is", null);
  revalidatePath("/ask");
  return { ok: true };
}
