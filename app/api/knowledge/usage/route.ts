import { NextRequest, NextResponse } from "next/server";
import { quotaFor, resolveActor } from "@/lib/knowledge/metering";

/** GET /api/knowledge/usage — скільки запитів лишилось сьогодні (для UI) */
export async function GET(req: NextRequest) {
  const actor = await resolveActor(req);
  const quota = await quotaFor(actor);
  return NextResponse.json({ ...quota, signedIn: actor.kind === "user" });
}
