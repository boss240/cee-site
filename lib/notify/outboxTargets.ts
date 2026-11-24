export type DeliveryChannel = "email_client" | "email_center" | "telegram";
export type DeliveryTarget = { channel: DeliveryChannel; recipient: string; status: "pending" | "blocked"; code: string | null };

/** Snapshot destinations, never credentials or message content. Empty target is a visible blocker. */
export function notificationTargets(email: string | null | undefined, env: NodeJS.ProcessEnv): DeliveryTarget[] {
  const split = (value?: string) => [...new Set((value ?? "").split(",").map(s => s.trim()).filter(Boolean))];
  const smtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);
  const targets: DeliveryTarget[] = [];
  const add = (channel: DeliveryChannel, recipient: string, ready: boolean) => targets.push({
    channel, recipient, status: recipient && ready ? "pending" : "blocked",
    code: !recipient ? "missing_recipient" : !ready ? "missing_config" : null,
  });
  if (email) add("email_client", email.trim(), smtp);
  // Dedupe case-insensitively but preserve the configured address bytes for transport.
  const centers = [...new Map(split(env.NOTIFY_TO).map(value => [value.toLowerCase(), value])).values()];
  const chats = split(env.TELEGRAM_CHAT_ID);
  // Prevent accidental unbounded fanout. Validate configuration before activating capture.
  if (centers.length > 50 || chats.length > 50) throw new Error("notification_target_limit");
  for (const recipient of centers.length ? centers : [""]) add("email_center", recipient, smtp);
  for (const recipient of chats.length ? chats : [""]) add("telegram", recipient, Boolean(env.TELEGRAM_BOT_TOKEN));
  return targets;
}
