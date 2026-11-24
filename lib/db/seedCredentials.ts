/** Require an operator-supplied credential before any seed/setup database work. */
export function requireSeedAdminPassword(
  env: Record<string, string | undefined> = process.env,
): string {
  const password = env.SEED_ADMIN_PASSWORD;
  if (!password || !password.trim()) {
    throw new Error("seed_admin_password_required");
  }
  return password;
}
