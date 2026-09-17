import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type Locale = "uk" | "en";

export type PostCard = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string | null;
  publishedAt: Date | null;
};

export type PostFull = PostCard & { body: string };

function pick(row: typeof schema.posts.$inferSelect, locale: Locale) {
  // Англійська версія може бути порожньою — тоді показуємо українську, а не порожнечу.
  const title = locale === "en" && row.titleEn ? row.titleEn : row.titleUk;
  const excerpt = locale === "en" && row.excerptEn ? row.excerptEn : row.excerptUk;
  const body = locale === "en" && row.bodyEn ? row.bodyEn : row.bodyUk;
  return { slug: row.slug, title, excerpt, body, tag: row.tag, publishedAt: row.publishedAt };
}

export async function listPublishedPosts(locale: Locale): Promise<PostCard[]> {
  try {
    const rows = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.published, true))
      .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.id));
    return rows.map((r) => {
      const p = pick(r, locale);
      return { slug: p.slug, title: p.title, excerpt: p.excerpt, tag: p.tag, publishedAt: p.publishedAt };
    });
  } catch {
    return [];
  }
}

export async function getPublishedPost(slug: string, locale: Locale): Promise<PostFull | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.slug, slug), eq(schema.posts.published, true)))
      .limit(1);
    return row ? pick(row, locale) : null;
  } catch {
    return null;
  }
}
