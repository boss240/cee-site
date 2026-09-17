import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const gateways = await db.select().from(schema.paymentGateways);
  return NextResponse.json({ gateways });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const body = await req.json();
  const { provider, isConnected } = body;
  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 });

  const [updated] = await db
    .update(schema.paymentGateways)
    .set({ isConnected: !!isConnected, updatedAt: new Date() })
    .where(eq(schema.paymentGateways.provider, provider))
    .returning();

  return NextResponse.json({ gateway: updated });
}
