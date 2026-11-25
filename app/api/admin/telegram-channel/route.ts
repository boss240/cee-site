import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { previewChannelPost, publishToChannel, readChannelStatus, type ChannelKind } from "@/lib/telegram/channel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function target(kind: unknown, id: unknown): { kind: ChannelKind; id: number } | null {
  const n = Number(id);
  if ((kind !== "post" && kind !== "digest") || !Number.isInteger(n) || n <= 0) return null;
  return { kind, id: n };
}

/** GET — стан каналу; GET ?kind=post|digest&id=N — попередній перегляд допису. Нічого не надсилає. */
export async function GET(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const sp = req.nextUrl.searchParams;
  if (!sp.has("kind")) {
    const status = await readChannelStatus();
    return NextResponse.json({ status: { ...status, config: { ...status.config } } });
  }
  const t = target(sp.get("kind"), sp.get("id"));
  if (!t) return NextResponse.json({ error: "Bad target" }, { status: 400 });
  return NextResponse.json(await previewChannelPost(t.kind, t.id));
}

/** POST {kind,id} — публікує матеріал у канал за явною дією адміністратора. */
export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const body = (await req.json().catch(() => null)) as { kind?: unknown; id?: unknown } | null;
  const t = target(body?.kind, body?.id);
  if (!t) return NextResponse.json({ error: "Bad target" }, { status: 400 });
  const r = await publishToChannel(t.kind, t.id);
  return NextResponse.json(r, { status: r.ok ? 200 : r.code === "already_posted" ? 409 : 422 });
}
