import { createHash } from "node:crypto";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { planFor, type Plan } from "./plans";
import { getUserSession } from "@/lib/auth/requireAdmin";
import { userIdFromSession } from "@/lib/auth/options";

const VISITOR_COOKIE = "cee_vid";

/** Хто питає: користувач (з планом) або гість (cookie+IP) */
export type Actor =
  | { kind: "user"; userId: number; plan: Plan; email: string }
  | { kind: "guest"; anonKey: string; plan: Plan };

async function visitorId(): Promise<string> {
  const jar = await cookies();
  let v = jar.get(VISITOR_COOKIE)?.value;
  if (!v) {
    v = createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 32);
    try {
      jar.set(VISITOR_COOKIE, v, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 24 * 3600 });
    } catch {
      /* у деяких контекстах cookie не встановити — тоді ліміт тримається на IP */
    }
  }
  return v;
}

export async function resolveActor(req: Request): Promise<Actor> {
  const s = await getUserSession();
  const userId = userIdFromSession(s?.user);
  if (s && userId) {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (u) return { kind: "user", userId: u.id, plan: planFor(u.plan, u.planUntil), email: u.email };
  }
  // адмін теж може питати — як enterprise
  if (s?.user.role === "admin") {
    return { kind: "guest", anonKey: `admin:${s.user.email}`, plan: planFor("enterprise") };
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const vid = await visitorId();
  const anonKey = createHash("sha256").update(`${vid}|${ip}`).digest("hex").slice(0, 48);
  return { kind: "guest", anonKey, plan: planFor("guest") };
}

function startOfToday(at = new Date()) {
  const d = new Date(at);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Скільки запитів актор уже зробив сьогодні */
export async function usedToday(actor: Actor, reader: Pick<typeof db, "select"> = db, at = new Date()): Promise<number> {
  const since = startOfToday(at);
  const where =
    actor.kind === "user"
      ? and(eq(schema.usageEvents.userId, actor.userId), eq(schema.usageEvents.kind, "ask"), gte(schema.usageEvents.createdAt, since))
      : and(eq(schema.usageEvents.anonKey, actor.anonKey), isNull(schema.usageEvents.userId), eq(schema.usageEvents.kind, "ask"), gte(schema.usageEvents.createdAt, since));
  const [row] = await reader.select({ n: sql<number>`count(*)::int` }).from(schema.usageEvents).where(where);
  return row?.n ?? 0;
}

export type Quota = { used: number; limit: number | null; remaining: number | null; plan: Plan["id"] };

export async function quotaFor(actor: Actor): Promise<Quota> {
  const used = await usedToday(actor);
  const limit = actor.plan.dailyAsk ?? actor.plan.fairUseAsk;
  return { used, limit: actor.plan.dailyAsk === null ? null : limit, remaining: Math.max(0, limit - used), plan: actor.plan.id };
}

/** Reserve a counted attempt before provider work; no external calls while holding the lock.
 * A crash/provider error keeps the reservation: unknown results must not grant free retries.
 * All ask callers must use this gate, not a separate read-then-record pair.
 */
export async function reserveAsk(actor: Actor, question: string): Promise<Quota | null> {
  return db.transaction(async (tx) => {
    const key = actor.kind === "user" ? `ask:user:${actor.userId}` : `ask:guest:${actor.anonKey}`;
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
    const admittedAt = new Date();
    const used = await usedToday(actor, tx, admittedAt);
    const limit = actor.plan.dailyAsk ?? actor.plan.fairUseAsk;
    if (used >= limit) return null;
    await tx.insert(schema.usageEvents).values({
      userId: actor.kind === "user" ? actor.userId : null,
      anonKey: actor.kind === "guest" ? actor.anonKey : null,
      kind: "ask", question: question.slice(0, 2000), createdAt: admittedAt,
    });
    return { used: used + 1, limit: actor.plan.dailyAsk === null ? null : limit,
      remaining: Math.max(0, limit - used - 1), plan: actor.plan.id };
  });
}
