import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isLoggedIn = !!req.auth;

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Admin/Researcher protection for dashboard
  const isAdmin = (req.auth?.user as any)?.isAdmin;
  if (isDashboard && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
