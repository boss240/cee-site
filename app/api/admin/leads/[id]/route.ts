import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

const PatchSchema = z.object({
  status: z.enum(["new", "in_progress", "done", "spam"]).optional(),
  adminNote: z.string().max(5000).optional(),
});

/** PATCH /api/admin/leads/:id — статус і нотатка адміністратора. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const [updated] = await db
    .update(schema.leads)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.leads.id, leadId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await db.delete(schema.leads).where(eq(schema.leads.id, leadId));
  return NextResponse.json({ ok: true });
}
