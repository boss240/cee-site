import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  let [profile] = await db.select().from(schema.companyProfile).limit(1);
  if (!profile) {
    [profile] = await db.insert(schema.companyProfile).values({}).returning();
  }
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const body = await req.json();
  let [profile] = await db.select().from(schema.companyProfile).limit(1);
  if (!profile) {
    [profile] = await db.insert(schema.companyProfile).values({}).returning();
  }

  const updatable: Record<string, unknown> = {};
  for (const key of ["legalName", "edrpou", "address", "iban", "bankName", "vatPayer", "email", "phone"]) {
    if (key in body) updatable[key] = body[key];
  }
  updatable.updatedAt = new Date();

  const [updated] = await db
    .update(schema.companyProfile)
    .set(updatable)
    .where(eq(schema.companyProfile.id, profile.id))
    .returning();

  return NextResponse.json({ profile: updated });
}
