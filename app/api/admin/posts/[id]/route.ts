import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { PostSchema } from "../route";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = PostSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

  const [current] = await db.select().from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const d = parsed.data;
  const becomesPublished = d.published === true && !current.published;
  const [updated] = await db
    .update(schema.posts)
    .set({
      ...d,
      tag: d.tag === undefined ? current.tag : d.tag || null,
      publishedAt: becomesPublished ? new Date() : d.published === false ? null : current.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.posts.id, postId))
    .returning();
  return NextResponse.json({ post: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  await db.delete(schema.posts).where(eq(schema.posts.id, postId));
  return NextResponse.json({ ok: true });
}
