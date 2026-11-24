import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { Link } from "@/i18n/navigation";
import { CanaryForm } from "./CanaryForm";
export const dynamic = "force-dynamic";
export default async function NotificationCanaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const english = locale === "en";
  if ((await requireAdminSession()).response) redirect(`/${english ? "en" : "uk"}/admin/login`);
  return <section className="space-y-4"><h1 className="text-2xl font-bold">{english ? "Controlled notification delivery test" : "Контрольована перевірка доставки сповіщень"}</h1>
    <Link href="/admin/notifications" className="underline">{english ? "Back to read-only queue" : "До перегляду черги"}</Link>
    <CanaryForm english={english} />
  </section>;
}
