import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
          console.warn(`[auth] too many login attempts scope=${scope} email=${email} ip=${ip}`);
          return null;
        }

        if (scope === "admin") {
          const [admin] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
          if (!admin) return null;
          if (!(await bcrypt.compare(password, admin.passwordHash))) return null;
          return { id: `admin:${admin.id}`, email: admin.email, name: admin.name ?? admin.email, role: "admin", plan: "enterprise" };
        }

        const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
        if (!user) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;
        await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
        return { id: `user:${user.id}`, email: user.email, name: user.name ?? user.email, role: "user", plan: user.plan };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as { id: string; role?: string; plan?: string };
        token.role = u.role ?? "user";
        token.plan = u.plan ?? "free";
        token.uid = u.id;
      }
      // При оновленні сесії (після зміни плану адміністратором) перечитуємо план із БД
      if (trigger === "update" && typeof token.uid === "string" && token.uid.startsWith("user:")) {
        const id = Number(token.uid.slice(5));
        const [fresh] = await db.select({ plan: schema.users.plan }).from(schema.users).where(eq(schema.users.id, id));
        if (fresh) token.plan = fresh.plan;
      }
      return token;
    },
    async session({ session, token }) {
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
  if (!user?.uid || !user.uid.startsWith("user:")) return null;
  const n = Number(user.uid.slice(5));
  return Number.isInteger(n) ? n : null;
}
