import type { LucideIcon } from "lucide-react";

export type BridgePier = {
  /** Коротка назва опори */
  label: string;
  /** Що ця сторона приносить у проєкт */
  items: string[];
  icon: LucideIcon;
};

type Props = {
  /** Ліва опора — звідки приходять кошти й рішення */
  from: BridgePier;
  /** Проліт — що несе Центр */
  center: BridgePier;
  /** Права опора — майданчик, виконавці, громада */
  to: BridgePier;
  /** Підпис під схемою */
  footer?: string;
  /** Підпис зворотного потоку (дані, звітність) */
  backLabel?: string;
};

function Pier({
  pier,
  highlight = false,
}: {
  pier: BridgePier;
  highlight?: boolean;
}) {
  const Icon = pier.icon;

  return (
    <div
      className={`flex h-full flex-col rounded-xl border bg-[var(--color-bg)] p-5 ${
        highlight
          ? "border-[var(--color-brand)] shadow-lg shadow-emerald-900/10"
          : "border-[var(--color-line)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            highlight
              ? "bg-[var(--color-brand)] text-white"
              : "border border-[var(--color-line)] text-[var(--color-brand-text)]"
          }`}
        >
          <Icon size={18} />
        </span>
        <h3 className="text-base font-semibold">{pier.label}</h3>
      </div>

      <ul className="mt-4 space-y-2">
        {pier.items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-sm text-[var(--color-fg-muted)]"
          >
            <span
              aria-hidden="true"
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-brand)]"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Схема «місток»: Центр як проліт між тим, хто дає кошти й ухвалює рішення,
 * і тим, що є на місці — майданчиком, виконавцями, громадою.
 * Пунктир рухається у бік майданчика, зворотний — у бік опори (дані про результат).
 */
export function BridgeDiagram({ from, center, to, footer, backLabel }: Props) {
  return (
    <figure className="m-0">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(28px,0.35fr)_minmax(0,1.15fr)_minmax(28px,0.35fr)_minmax(0,1fr)] lg:items-stretch">
        <Pier pier={from} />
        <span aria-hidden="true" className="bridge-link" />
        <Pier pier={center} highlight />
        <span aria-hidden="true" className="bridge-link" />
        <Pier pier={to} />
      </div>

      {backLabel ? (
        <div className="mt-4 hidden items-center gap-3 lg:flex">
          <span aria-hidden="true" className="bridge-link bridge-link-back" />
          <span className="mono-label shrink-0 text-[var(--color-fg-placeholder)]">
            {backLabel}
          </span>
          <span aria-hidden="true" className="bridge-link bridge-link-back" />
        </div>
      ) : null}

      {footer ? (
        <figcaption className="mt-5 text-sm text-[var(--color-fg-muted)]">
          {footer}
        </figcaption>
      ) : null}
    </figure>
  );
}
