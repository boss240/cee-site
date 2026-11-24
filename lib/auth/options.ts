import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { tooManyRequests } from "@/lib/rateLimit";

/**
 * NextAuth (credentials) для двох типів облікових записів:
 *  - admin_users → role "admin" (адмінка);
 *  - users       → role "user"  (база знань, ліміти, підписка).
 * Сесія — JWT; роль і план зберігаються в токені.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 днів для користувачів
  pages: { signIn: "/uk/account/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        scope: { label: "Scope", type: "text" }, // "admin" | "user" — з якої форми входять
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        const scope = credentials?.scope === "admin" ? "admin" : "user";
        if (!email || !password) return null;

        // Захист від перебору паролів: не більше 10 спроб на e-mail і 30 з однієї IP-адреси за 15 хвилин.
        // Лічильник у пам'яті процесу (як і решта лімітів) — при перевищенні вхід просто не вдається.
        const headers = (req?.headers ?? {}) as Record<string, string | string[] | undefined>;
        const fwd = headers["x-forwarded-for"];
        const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() || (headers["x-real-ip"] as string | undefined) || "local";
        const windowMs = 15 * 60 * 1000;
        if (tooManyRequests(`login:email:${scope}:${email}`, 10, windowMs) || tooManyRequests(`login:ip:${ip}`, 30, windowMs)) {
          console.warn(JSON.stringify({ event: "auth_rate_limited", scope }));
          return null;
        }

        if (scope === "admin") {
          const [admin] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
          if (!admin || admin.role !== "admin") return null;
          if (!(await bcrypt.compare(password, admin.passwordHash))) return null;
          return { id: `admin:${admin.id}`, email: admin.email, name: admin.name ?? admin.email, role: "admin", plan: "enterprise", credentialStamp: credentialStamp(admin.passwordHash) };
        }

        const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
        if (!user) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;
        await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
        return { id: `user:${user.id}`, email: user.email, name: user.name ?? user.email, role: "user", plan: user.plan, credentialStamp: credentialStamp(user.passwordHash) };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; email?: string | null; role?: string; plan?: string; credentialStamp?: string };
        token.role = u.role;
        token.plan = u.plan;
        token.uid = u.id;
        token.email = u.email;
        token.credentialStamp = u.credentialStamp;
      }
      // Validate every session read, including update; client update data is never trusted.
      // Old tokens without a stamp require a fresh login. A DB failure grants no access.
      const role = token.role;
      const id = accountId(token.uid, role);
      try {
        if (!id || typeof token.credentialStamp !== "string") throw new Error("Invalid session");
        if (role === "admin") {
          const [admin] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id));
          if (!admin || admin.role !== "admin" || admin.email !== token.email || credentialStamp(admin.passwordHash) !== token.credentialStamp) throw new Error("Revoked session");
          token.plan = "enterprise";
        } else {
          const [fresh] = await db.select().from(schema.users).where(eq(schema.users.id, id));
          if (!fresh || fresh.email !== token.email || credentialStamp(fresh.passwordHash) !== token.credentialStamp) throw new Error("Revoked session");
          token.plan = fresh.plan;
        }
      } catch {
        token.role = "revoked";
        token.uid = undefined;
        token.plan = undefined;
        token.credentialStamp = undefined;
        token.email = undefined;
        token.name = undefined;
        token.picture = undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (!accountId(token.uid, token.role) || typeof token.credentialStamp !== "string") {
        session.user = undefined;
        return session;
      }
      if (session.user) {
        const su = session.user as typeof session.user & { role?: string; plan?: string; uid?: string };
        su.role = token.role as string | undefined;
        su.plan = token.plan as string | undefined;
        su.uid = token.uid as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export type SessionUser = { email?: string | null; name?: string | null; role?: string; plan?: string; uid?: string };

/** Числовий id користувача з таблиці users (або null для адміна/гостя) */
export function userIdFromSession(user: SessionUser | undefined | null): number | null {
  return accountId(user?.uid, user?.role === "user" ? "user" : undefined);
}

function credentialStamp(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex");
}

function accountId(uid: unknown, role: unknown): number | null {
  if (role !== "admin" && role !== "user") return null;
  if (typeof uid !== "string" || !new RegExp(`^${role}:[1-9][0-9]*$`).test(uid)) return null;
  const id = Number(uid.slice(role.length + 1));
  return Number.isSafeInteger(id) ? id : null;
}
