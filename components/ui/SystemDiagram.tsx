"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type NodeId = "pv" | "load" | "bess" | "meter" | "grid" | "ems";

type NodeDef = {
  id: NodeId;
  label: string;
  role: string;
  details: string[];
};

const POSITIONS: Record<NodeId, { x: number; y: number }> = {
  pv: { x: 80, y: 60 },
  bess: { x: 80, y: 210 },
  load: { x: 285, y: 60 },
  ems: { x: 285, y: 210 },
  meter: { x: 490, y: 135 },
  grid: { x: 660, y: 135 },
};

const LINKS: [NodeId, NodeId][] = [
  ["pv", "load"],
  ["pv", "bess"],
  ["bess", "ems"],
  ["load", "meter"],
  ["ems", "meter"],
  ["meter", "grid"],
];

const W = 62;
const H = 44;

function center(pos: { x: number; y: number }) {
  return { cx: pos.x + W / 2, cy: pos.y + H / 2 };
}

export function SystemDiagram() {
  const t = useTranslations("SystemDiagram");
  const nodes = t.raw("nodes") as NodeDef[];
  const [active, setActive] = useState<NodeId>("ems");
  const node = nodes.find((n) => n.id === active) ?? nodes[3];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]">
        <svg
          viewBox="0 0 760 300"
          role="img"
          aria-label={t("ariaLabel")}
          className="grid-tech h-auto w-full min-w-[640px]"
        >
          {LINKS.map(([a, b]) => {
            const pa = center(POSITIONS[a]);
            const pb = center(POSITIONS[b]);
            const on = active === a || active === b;
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.cx}
                y1={pa.cy}
                x2={pb.cx}
                y2={pb.cy}
                stroke={on ? "#047857" : "#9ca3af"}
                strokeWidth={on ? 2 : 1.25}
                className={on ? "flow-line" : undefined}
              />
            );
          })}

          {nodes.map((n) => {
            const on = active === n.id;
            const pos = POSITIONS[n.id];
            return (
              <g
                key={n.id}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${n.label}: ${n.role}`}
                onClick={() => setActive(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(n.id);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={W}
                  height={H}
                  rx={4}
                  fill={on ? "#047857" : "var(--color-bg)"}
                  stroke={on ? "#047857" : "#6b7280"}
                  strokeWidth={1.5}
                />
                <text
                  x={pos.x + W / 2}
                  y={pos.y + H / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={on ? "#ffffff" : "var(--color-fg)"}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <p className="mono-label text-[var(--color-fg-placeholder)]">
          {node.role}
        </p>
        <h3 className="mt-2 text-2xl">{node.label}</h3>
        <ul className="mt-4 space-y-2.5">
          {node.details.map((d) => (
            <li key={d} className="flex gap-2 text-sm text-[var(--color-fg-muted)]">
              <span aria-hidden="true" className="text-[var(--color-brand-text)]">
                —
              </span>
              {d}
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-fg-placeholder)]">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
