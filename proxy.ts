import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js "proxy" (formerly middleware). Refreshes the Supabase session on
 * every request and gates access:
 *  - unauthenticated users are redirected to /login (except public routes)
 *  - authenticated users are bounced away from /login
 * Public routes: the QR plant page (/p/*) and the invoice page (/invoice/*).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Entry auth pages: authenticated users get bounced to the app.
  const isAuthEntry = path === "/login" || path === "/forgot-password";
  // Recovery flow needs a (recovery) session, so it must NOT bounce.
  const isRecovery = path === "/reset-password" || path.startsWith("/auth/");
  const isPublicRoute =
    isAuthEntry ||
    isRecovery ||
    path.startsWith("/p/") ||
    path.startsWith("/invoice/");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthEntry) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
