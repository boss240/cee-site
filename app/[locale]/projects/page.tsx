import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FileSearch, FileCheck2, FileCode2, Landmark, FileSignature, ShoppingCart, PlugZap, LineChart, LayoutDashboard, Zap, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { EnergyField } from "@/components/ui/EnergyField";

type Artifact = { title: string; text: string; stage: string };
type Proof = { title: string; text: string };

const ARTIFACT_ICONS = [FileSearch, FileCheck2, FileCode2, Landmark, FileSignature, ShoppingCart, PlugZap, LineChart, LayoutDashboard, Zap];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ProjectsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ProjectsPage() {
  const t = await getTranslations("ProjectsPage");
  const artifacts = t.raw("artifacts") as Artifact[];
  const proof = t.raw("proof") as Proof[];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg)]">
        <div aria-hidden="true" className="grid-tech absolute inset-0 opacity-60" />
        <EnergyField variant="hero" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("heroLabel")}</p>
            <h1 className="hero-title mt-3 max-w-4xl">{t("heroTitle")}</h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="mt-6 max-w-2xl text-lg text-[var(--color-fg-muted)]">{t("heroText")}</p>
          </Reveal>
        </div>
      </section>

      {/* Артефакти по етапах */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="mono-label text-[var(--color-brand-text)]">{t("artifactsLabel")}</p>
          <h2 className="mt-2">{t("artifactsTitle")}</h2>
          <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("artifactsText")}</p>
        </Reveal>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((a, i) => {
            const Icon = ARTIFACT_ICONS[i] ?? FileCheck2;
            const final = i === artifacts.length - 1;
            return (
              <Reveal as="li" key={a.title} delay={(i % 3) * 90} className={final ? "sm:col-span-2 lg:col-span-3" : ""}>
                <div className={`lift flex h-full flex-col rounded-xl border bg-[var(--color-bg)] p-6 ${final ? "border-[var(--color-brand)] shadow-lg shadow-emerald-900/10 lg:flex-row lg:items-center lg:gap-8" : "border-[var(--color-line)]"}`}>
                  <div className="flex items-center justify-between lg:shrink-0">
                    <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-lg ${final ? "bg-[var(--color-brand)] text-white" : "border border-[var(--color-line)] text-[var(--color-brand-text)]"}`}>
                      <Icon size={20} />
                    </span>
                    <span className="mono-label text-[var(--color-fg-placeholder)] lg:hidden">{a.stage}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mt-4 lg:mt-0">{a.title}</h3>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{a.text}</p>
                  </div>
                  <span className="mono-label mt-4 hidden text-[var(--color-fg-placeholder)] lg:mt-0 lg:block lg:shrink-0">{a.stage}</span>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* Як підтверджуємо результат */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <p className="mono-label text-[var(--color-brand-text)]">{t("proofLabel")}</p>
            <h2 className="mt-2">{t("proofTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)]">{t("proofText")}</p>
          </Reveal>
          <ol className="mt-10 grid gap-5 lg:grid-cols-3">
            {proof.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 90}>
                <div className="h-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
                  <span className="mono-label text-[var(--color-fg-placeholder)]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3">{p.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={300}>
            <p className="mt-8 max-w-3xl border-l-2 border-[var(--color-brand)] pl-5 text-sm text-[var(--color-fg-muted)]">{t("casesNote")}</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#070b12] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <EnergyField variant="band" forceDark />
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#070b12_95%)]" />
            <div className="relative">
              <h2 className="text-white">{t("ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/90">{t("ctaText")}</p>
              <Link href="/contacts" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-[var(--color-brand-dark)] transition hover:bg-[var(--color-surface)]">
                {t("ctaPrimary")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
