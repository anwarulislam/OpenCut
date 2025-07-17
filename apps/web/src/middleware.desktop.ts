// Desktop-specific middleware configuration
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // For desktop builds, we might want to disable certain protections
  // or handle them differently since it's a local application

  const path = request.nextUrl.pathname;

  // For desktop builds, always redirect to /projects on startup
  if (process.env.BUILD_TARGET === "desktop") {
    // Redirect root path to /projects for desktop app
    if (path === "/") {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
    return NextResponse.next();
  }

  // Original middleware logic for web builds
  const protectedPaths = ["/editor", "/projects"];

  // Handle fuckcapcut.com domain redirect
  if (request.headers.get("host") === "fuckcapcut.com") {
    return NextResponse.redirect("https://opencut.app/why-not-capcut", 301);
  }

  if (protectedPaths.includes(path) && process.env.NODE_ENV === "production") {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("redirect", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
