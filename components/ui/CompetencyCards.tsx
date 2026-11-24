"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Ruler, Calculator, FileCode2, Wrench } from "lucide-react";
import { Link } from "@/i18n/navigation";

const ids = ["survey", "analysis", "concept", "support"] as const;
const icons = [Ruler, Calculator, FileCode2, Wrench];
const sections = ["why", "data", "result", "limits", "next"] as const;
type Competency = { n: string; title: string; text: string; dialog: Record<typeof sections[number], string> };

function selectedFromUrl() {
  const index = ids.indexOf(new URL(window.location.href).searchParams.get("service") as typeof ids[number]);
  return index < 0 ? null : index;
}

/** Native modal keeps the rest of the page inert, including the AI widget. */
export function CompetencyCards() {
  const t = useTranslations("HomePage");
  const items = t.raw("competencies") as Competency[];
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const closing = useRef(false);

  useEffect(() => {
    const sync = () => {
      startTransition(() => setActive(selectedFromUrl()));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (active === null || !element) return;
    closing.current = false;
    const returnTarget = triggers.current[active];
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    heading.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      returnTarget?.focus({ preventScroll: true });
    };
  }, [active]);

  function open(index: number) {
    closing.current = false;
    const url = new URL(window.location.href);
    url.searchParams.set("service", ids[index]);
    window.history.pushState({ ...window.history.state, ceeCompetencyEntry: true }, "", url);
    setActive(index);
  }

  function close() {
    if (closing.current) return;
    closing.current = true;
    if (window.history.state?.ceeCompetencyEntry) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("service");
      window.history.replaceState(window.history.state, "", url);
      setActive(null);
    }
  }

  return <>
    <ul className="mt-10 grid gap-5 sm:grid-cols-2">
      {items.map((item, index) => {
        const Icon = icons[index];
        return <li key={ids[index]} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
          <div className="flex items-center justify-between"><Icon aria-hidden size={24} className="text-[var(--color-brand-text)]" /><span aria-hidden className="mono-label">{item.n}</span></div>
          <h3 className="mt-4">{item.title}</h3>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{item.text}</p>
          <button ref={element => { triggers.current[index] = element; }} type="button" aria-haspopup="dialog" onClick={() => open(index)} className="mt-5 min-h-11 rounded-lg border border-[var(--color-line)] px-4 py-2 text-left font-semibold text-[var(--color-brand-text)]">
            {t("competencyDialogLabels.open", { title: item.title })}
          </button>
        </li>;
      })}
    </ul>
    <dialog ref={dialog} aria-labelledby="competency-dialog-title" aria-modal="true"
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-0 text-[var(--color-fg)] shadow-xl backdrop:bg-black/60"
      onCancel={event => { event.preventDefault(); close(); }}
      onKeyDown={event => {
        if (event.key === "Escape") event.stopPropagation();
        if (event.key !== "Tab") return;
        const controls = dialog.current?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }}>
      {active !== null && <>
        <div className="sticky top-0 z-10 flex justify-end border-b border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-3">
          <button type="button" onClick={close} className="min-h-11 rounded-lg border border-[var(--color-line)] px-4 py-2">{t("competencyDialogLabels.close")}</button>
        </div>
        <div className="p-5 sm:p-8">
          <h2 id="competency-dialog-title" ref={heading} tabIndex={-1} className="text-2xl">{items[active].title}</h2>
          {sections.map(section => <section key={section} className="mt-5"><h3 className="text-lg">{t(`competencyDialogLabels.${section}`)}</h3><p className="mt-2 text-[var(--color-fg-muted)]">{items[active].dialog[section]}</p></section>)}
          <Link href={`/contacts?topic=service-${ids[active]}`} className="mt-6 inline-block min-h-11 rounded-lg bg-[var(--color-brand)] px-5 py-3 font-semibold text-white">{t("ctaPrimary")}</Link>
        </div>
      </>}
    </dialog>
  </>;
}
