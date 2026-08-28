/**
 * Environment, read lazily. Nothing here throws at import time — the app has
 * to be buildable (and the design previewable) on a machine with no keys.
 */

/**
 * Supabase renamed its keys: `anon` is now the publishable key
 * (sb_publishable_…) and `service_role` is now the secret key (sb_secret_…).
 * Both namings are accepted so an older project keeps working, but the
 * publishable/secret names are the ones the dashboard shows today.
 */
const publishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const secretKey = () =>
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publishableKey());
}

export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publishableKey();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return { url, anonKey: key };
}

export function serviceRoleKey(): string {
  const key = secretKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. It is needed for account deletion and " +
        "the admin page, and must never be exposed to the browser."
    );
  }
  return key;
}

/** Emails allowed into /admin. Comma separated, e.g. "you@example.com". */
export function founderEmails(): string[] {
  return (process.env.MARLOW_FOUNDER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const anthropicConfigured = () =>
  Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
