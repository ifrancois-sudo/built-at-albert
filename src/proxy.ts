import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/public-config";

// Next 16 pins the proxy to the Node.js runtime and rejects any runtime
// export here, so the adapter's "Node.js middleware is experimental" warning at
// build time is expected. Keep this file to the two things it must do — refresh
// the auth cookie and bounce unauthenticated requests — so it stays cheap and
// easy to move if that support changes. Pages and route handlers must never
// declare a runtime at all; the adapter chooses.

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/callback",
  "/legal",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Refreshing the session here is what keeps the auth cookie alive for
  // Server Components, which cannot write cookies themselves.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  // A session can exist before the address is confirmed; that account gets to
  // see the reminder screen and nothing else.
  if (user && !user.email_confirmed_at && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/verify-email";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  if (user && user.email_confirmed_at && (pathname === "/login" || pathname === "/signup")) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/ideas";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
