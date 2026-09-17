import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, type SessionUser } from "./options";

/**
 * Охоронець для /api/admin/* маршрутів: потрібна сесія з роллю admin.
 * Публічний користувач (role "user") сюди не проходить.
 */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUser | undefined)?.role;
  if (!session || role !== "admin") {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

/** Сесія публічного користувача (для бази знань). Повертає null для гостя. */
export async function getUserSession() {
  const session = await getServerSession(authOptions);
  const u = session?.user as SessionUser | undefined;
  if (!session || !u) return null;
  return { session, user: u };
}
