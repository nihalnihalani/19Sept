import { NextRequest, NextResponse } from "next/server";

// Rewrite deep links like /create, /edit, /video, /gallery, /compose to /
// so the SPA can hydrate and set the correct mode client-side without 404s.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Only rewrite exact top-level paths
  if (["/all", "/cultural", "/create", "/edit", "/video", "/gallery", "/compose"].includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/all", "/cultural", "/create", "/edit", "/video", "/gallery", "/compose"],
};
