import { z } from "zod";

// Схема валідації публікації блогу (спільна для POST /api/admin/posts і PATCH /api/admin/posts/[id]).
// Винесена з route.ts: Next.js забороняє експортувати з route-файлів будь-що, крім HTTP-обробників.
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

export type PostInput = z.infer<typeof PostSchema>;
