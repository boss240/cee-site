import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/requireAdmin";

/** GET /api/auth/me — для шапки: чи є сесія і яка роль (без персональних даних) */
export async function GET() {
  const s = await getUserSession();
  if (!s) return NextResponse.json({ signedIn: false });
  return NextResponse.json({ signedIn: true, role: s.user.role ?? "user", plan: s.user.plan ?? null });
}
export const dynamic = "force-dynamic";
