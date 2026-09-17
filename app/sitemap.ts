import type { MetadataRoute } from "next";
import { NAV } from "@/lib/nav";
import { listPublishedPosts } from "@/lib/blog/queries";
import { searchDocuments } from "@/lib/knowledge/documents";
import { listPublishedDigests } from "@/lib/knowledge/digests";

const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const locales = ["uk", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = ["/", ...NAV.map((n) => n.href), "/knowledge/documents", "/knowledge/digests", "/knowledge/ask", "/knowledge/pricing", "/privacy", "/terms"];
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}${path === "/" ? "" : path}`,
        lastModified: now,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.7,
        alternates: { languages: { uk: `${base}/uk${path === "/" ? "" : path}`, en: `${base}/en${path === "/" ? "" : path}` } },
      });
    }
  }

  const posts = await listPublishedPosts("uk");
  for (const p of posts) {
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}/blog/${p.slug}`,
        lastModified: p.publishedAt ?? now,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
  }
  const docs = await searchDocuments({ limit: 500 });
  for (const d of docs) {
    for (const locale of locales) {
      entries.push({ url: `${base}/${locale}/knowledge/documents/${d.slug}`, lastModified: d.updatedAt ?? now, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  const digests = await listPublishedDigests(500);
  for (const g of digests) {
    for (const locale of locales) {
      entries.push({ url: `${base}/${locale}/knowledge/digests/${g.slug}`, lastModified: g.publishedAt ?? now, changeFrequency: "yearly", priority: 0.5 });
    }
  }
  return entries;
}
