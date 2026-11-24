import { z } from "zod";
import { safeExternalUrl } from "../safeExternalUrl";

const optionalSourceUrl = z.string().trim().max(500).refine(
  value => value === "" || safeExternalUrl(value) !== null,
  "Expected an absolute HTTP/HTTPS URL without credentials",
).optional().nullable();
import { DOC_KINDS } from "./documents";

export const DocumentSchema = z.object({
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/, "slug: лише a-z, 0-9 і дефіс"),
  kind: z.enum(DOC_KINDS),
  number: z.string().trim().max(120).optional().nullable(),
  title: z.string().trim().min(2).max(500),
  issuer: z.string().trim().max(255).optional().nullable(),
  adoptedAt: z.string().trim().optional().nullable(), // YYYY-MM-DD
  status: z.enum(["active", "amended", "repealed", "draft"]).default("active"),
  summary: z.string().max(100_000).default(""),
  keyPoints: z.array(z.string().trim().min(1).max(1000)).max(40).default([]),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  sourceUrl: optionalSourceUrl,
  checked: z.boolean().default(false), // true → checkedAt = now
  published: z.boolean().default(false),
});

export const DocumentUpdateSchema = z.object({
  date: z.string().trim().optional().nullable(),
  note: z.string().trim().min(2).max(5000),
  sourceUrl: optionalSourceUrl,
});

export const SourceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  url: z.string().trim().max(500).refine(value => safeExternalUrl(value) !== null, "Expected an absolute HTTP/HTTPS URL without credentials"),
  category: z.enum(["regulator", "government", "operator", "market", "media", "local"]).default("media"),
  enabled: z.boolean().default(false),
});

export const DigestSchema = z.object({
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/, "slug: лише a-z, 0-9 і дефіс"),
  title: z.string().trim().min(2).max(255),
  kind: z.enum(["energy", "local"]).default("energy"),
  periodFrom: z.string().trim().optional().nullable(),
  periodTo: z.string().trim().optional().nullable(),
  intro: z.string().max(5000).default(""),
  body: z.string().max(200_000).default(""),
  published: z.boolean().default(false),
  newsIds: z.array(z.number().int()).max(500).optional(),
});

export const UserPlanSchema = z.object({
  plan: z.enum(["free", "premium", "enterprise"]),
  planUntil: z.string().trim().optional().nullable(),
});

export function toDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
