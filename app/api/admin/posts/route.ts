import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export const PostSchema = z.object({
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/, "slug: лише a-z, 0-9 і дефіс"),
  titleUk: z.string().trim().min(2).max(255),
  titleEn: z.string().trim().max(255).default(""),
  excerptUk: z.string().trim().max(2000).default(""),
  excerptEn: z.string().trim().max(2000).default(""),
  bodyUk: z.string().max(100_000).default(""),
  bodyEn: z.string().max(100_000).default(""),
  tag: z.string().trim().max(64).optional().nullable(),
  published: z.boolean().default(false),
});

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const list = await db.select().from(schema.posts).orderBy(desc(schema.posts.updatedAt));
  return NextResponse.json({ posts: list });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  try {
    const [created] = await db
      .insert(schema.posts)
      .values({ ...d, tag: d.tag || null, publishedAt: d.published ? new Date() : null })
      .returning();
    return NextResponse.json({ post: created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg.includes("unique") ? "Такий slug уже існує" : "Insert failed" }, { status: 409 });
  }
}
