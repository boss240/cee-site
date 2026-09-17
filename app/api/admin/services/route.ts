import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const list = await db.select().from(schema.services).orderBy(desc(schema.services.createdAt));
  return NextResponse.json({ services: list });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const body = await req.json();
  const [created] = await db
    .insert(schema.services)
    .values({
      titleUk: body.titleUk ?? "",
      titleEn: body.titleEn ?? "",
      descriptionUk: body.descriptionUk ?? "",
      descriptionEn: body.descriptionEn ?? "",
      price: Number(body.price) || 0,
      currency: body.currency ?? "UAH",
      status: body.status ?? "active",
    })
    .returning();

  return NextResponse.json({ service: created }, { status: 201 });
}
