import { getTranslations } from "next-intl/server";
import { Zap, Thermometer, Droplets, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Direction = { id: string; title: string; intro: string; tasks: string[]; data: string; result: string };
const icons = [Zap, Thermometer, Droplets, Waves];
export async function EngineeringDirections({ detailed = false }: { detailed?: boolean }) {
  const t = await getTranslations("DirectionsPage");
  const items = t.raw("items") as Direction[];
  const Heading = detailed ? "h2" : "h3";
  return <div className="mt-10 grid gap-6 md:grid-cols-2">
    {items.map((item, index) => {
      const Icon = icons[index];
      return <section key={item.id} id={detailed ? item.id : undefined} className="scroll-mt-28 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <Icon aria-hidden size={28} className="text-[var(--color-brand-text)]" />
        <Heading className="mt-4 text-2xl">{item.title}</Heading><p className="mt-3 text-[var(--color-fg-muted)]">{item.intro}</p>
        {detailed ? <><h3 className="mt-5 text-base">{t("tasksLabel")}</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{item.tasks.map((task) => <li key={task}>{task}</li>)}</ul><h3 className="mt-5 text-base">{t("dataLabel")}</h3><p className="mt-2 text-sm text-[var(--color-fg-muted)]">{item.data}</p><h3 className="mt-5 text-base">{t("resultLabel")}</h3><p className="mt-2 text-sm text-[var(--color-fg-muted)]">{item.result}</p></> : <Link href={`/directions#${item.id}`} className="mt-5 inline-block py-2 font-semibold text-[var(--color-brand-text)]">{t("details", { direction: item.title })}</Link>}
      </section>;
    })}
  </div>;
}
export async function EngineeringProcess() {
  const t = await getTranslations("DirectionsPage");
  const steps = t.raw("process") as { title: string; text: string }[];
  return <section className="mt-16"><h2>{t("processTitle")}</h2><ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{steps.map((step,index) => <li key={step.title} className="rounded-xl border border-[var(--color-line)] p-5"><span aria-hidden className="font-mono text-[var(--color-brand-text)]">0{index+1}</span><h3 className="mt-2 text-lg">{step.title}</h3><p className="mt-3 text-sm text-[var(--color-fg-muted)]">{step.text}</p></li>)}</ol></section>;
}
