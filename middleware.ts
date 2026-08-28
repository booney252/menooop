import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfigured, supabaseEnv } from "@/lib/env";

/** Routes reachable without an account. */
const PUBLIC = [
  "/sign-in",
  "/auth",
  "/privacy",
  "/setup",
  "/offline",
  "/manifest.webmanifest",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // the design preview, which only exists when explicitly switched on
  if (pathname.startsWith("/preview")) {
    return process.env.MARLOW_PREVIEW === "1"
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url));
  }

  // pages that are just words, and need nothing from the database
  const STATIC = ["/privacy", "/offline", "/setup"];
  if (STATIC.some((p) => pathname === p)) return NextResponse.next();

  if (!supabaseConfigured()) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // Refreshes the session cookie. Must run before any redirect decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const to = new URL("/sign-in", request.url);
    if (pathname !== "/") to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }

  if (user && pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // everything except static assets and the icons
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|.*\\.(?:png|svg|webp|ico|txt)$).*)",
  ],
};
