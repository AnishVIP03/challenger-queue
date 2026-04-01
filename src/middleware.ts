import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

interface SessionData {
  staffLoggedIn?: boolean;
}

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long_here",
  cookieName: "challenger-queue-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect staff pages and staff API routes (except login)
  const isStaffPage = pathname === "/staff";
  const isStaffApi =
    pathname.startsWith("/api/staff/") && !pathname.startsWith("/api/staff/login");

  if (isStaffPage || isStaffApi) {
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!session.staffLoggedIn) {
      if (isStaffApi) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/staff/login", req.url));
    }

    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff", "/api/staff/:path*"],
};
