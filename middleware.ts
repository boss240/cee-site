import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const localize = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/api/admin" || path.startsWith("/api/admin/") || path === "/api/knowledge/ask") {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.get("origin");
      if (req.headers.get("sec-fetch-site") === "cross-site" ||
          (origin !== null && origin !== req.nextUrl.origin)) {
        return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      }
    }
    // Non-browser clients may omit Origin; route-level authentication still applies.
    return NextResponse.next();
  }
  return localize(req);
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/knowledge/ask", "/((?!api|_next|.*\\..*).*)"],
};
