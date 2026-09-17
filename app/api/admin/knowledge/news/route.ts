import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { listNews } from "@/lib/knowledge/rss";

export async function GET(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const p = req.nextUrl.searchParams;
  const from = p.get("from") ? new Date(p.get("from")!) : undefined;
  const to = p.get("to") ? new Date(`${p.get("to")}T23:59:59`) : undefined;
  const news = await listNews({ from, to, limit: 300, unassignedOnly: p.get("unassigned") === "1" });
  return NextResponse.json({ news });
}
