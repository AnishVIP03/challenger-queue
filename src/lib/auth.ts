import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

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

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isStaffLoggedIn(): Promise<boolean> {
  const session = await getSession();
  return !!session.staffLoggedIn;
}

export async function requireStaffAuth(): Promise<boolean> {
  return await isStaffLoggedIn();
}
