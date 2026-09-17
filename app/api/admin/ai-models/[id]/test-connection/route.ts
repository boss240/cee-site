import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { testModelConnection } from "@/lib/ai-factory";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const [model] = await db.select().from(schema.aiModels).where(eq(schema.aiModels.id, Number(id)));
  if (!model) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await testModelConnection(model);
  return NextResponse.json(result);
}
