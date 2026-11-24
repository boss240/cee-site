"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { serviceIds, serviceSections, type ServiceDescription } from "@/lib/serviceDescriptions";

type Product = { name: string; task: string; results: string[] };
type Props = { products: Product[]; descriptions: ServiceDescription[] };

function selectedFromUrl() {
  const requested = new URL(window.location.href).searchParams.get("service");
  const index = serviceIds.findIndex(id => id === requested);
  return index < 0 ? null : index;
}

/** The native top-layer dialog makes all background controls inert. */
export function ServiceCatalogCards({ products, descriptions }: Props) {
  const t = useTranslations("ServicesPage");
  const home = useTranslations("HomePage");
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const closing = useRef(false);
  const opening = useRef(false);

  useEffect(() => {
    const sync = () => startTransition(() => setActive(selectedFromUrl()));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (active === null || !element) return;
    closing.current = false;
    opening.current = false;
    const returnTarget = triggers.current[active];
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    heading.current?.focus({ preventScroll: true });
    element.scrollTop = 0;
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      returnTarget?.focus({ preventScroll: true });
    };
  }, [active]);

  function open(index: number) {
    if (opening.current || active !== null) return;
    opening.current = true;
    closing.current = false;
    const url = new URL(window.location.href);
    url.searchParams.set("service", serviceIds[index]);
    window.history.pushState({ ...window.history.state, ceeServiceEntry: url.pathname }, "", url);
    setActive(index);
  }

  function close() {
    if (closing.current) return;
    closing.current = true;
    if (window.history.state?.ceeServiceEntry === window.location.pathname) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("service");
      window.history.replaceState(window.history.state, "", url);
      setActive(null);
    }
  }

  return <>
    <ul className="mt-10 grid gap-5 lg:grid-cols-2">
      {products.map((product, index) => <li key={serviceIds[index]}>
        <article className="flex h-full flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-semibold text-[var(--color-fg)]">{product.name}</h3>
            <span aria-hidden className="mono-label text-[var(--color-fg-placeholder)]">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">{product.task}</p>
          <div className="mt-5 border-t border-[var(--color-line)] pt-4">
            <p className="mono-label text-[var(--color-brand-text)]">{t("resultLabel")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">{product.results.map(result => <li key={result} className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-fg-muted)]">{result}</li>)}</ul>
          </div>
          <button ref={element => { triggers.current[index] = element; }} type="button" aria-haspopup="dialog" onClick={() => open(index)} className="mt-5 min-h-11 self-start rounded-lg border border-[var(--color-line)] px-4 py-2 text-left font-semibold text-[var(--color-brand-text)]">
            {home("competencyDialogLabels.open", { title: product.name })}
          </button>
        </article>
      </li>)}
    </ul>
    <dialog ref={dialog} aria-labelledby="service-dialog-title" aria-modal="true"
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
          <button type="button" onClick={close} className="min-h-11 rounded-lg border border-[var(--color-line)] px-4 py-2">{home("competencyDialogLabels.close")}</button>
        </div>
        <div className="p-5 sm:p-8">
          <h2 id="service-dialog-title" ref={heading} tabIndex={-1} className="text-2xl">{products[active].name}</h2>
          {serviceSections.map(section => <section key={section} className="mt-5"><h3 className="text-lg">{home(`competencyDialogLabels.${section}`)}</h3><p className="mt-2 text-[var(--color-fg-muted)]">{descriptions[active][section]}</p></section>)}
          <Link href={`/contacts?topic=service-${serviceIds[active]}`} className="mt-6 inline-block min-h-11 rounded-lg bg-[var(--color-brand)] px-5 py-3 font-semibold text-white">{home("ctaPrimary")}</Link>
        </div>
      </>}
    </dialog>
  </>;
}
