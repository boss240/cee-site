import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { buildDigestDraft } from "@/lib/knowledge/digests";

const Body = z.object({ from: z.string(), to: z.string(), unassignedOnly: z.boolean().default(true), kind: z.enum(["energy", "local"]).default("energy") });

/** POST — згенерувати чернетку дайджесту за період (AI, або шаблон без ключа) */
export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  const from = new Date(`${parsed.data.from}T00:00:00`);
  const to = new Date(`${parsed.data.to}T23:59:59`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return NextResponse.json({ error: "Bad dates" }, { status: 400 });
  const draft = await buildDigestDraft({ from, to, unassignedOnly: parsed.data.unassignedOnly, kind: parsed.data.kind });
  return NextResponse.json({ draft });
}
