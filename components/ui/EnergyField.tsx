"use client";

import { useEffect, useRef } from "react";

type Props = {
  /**
   * hero — повний набір шарів (сяйво, перспективна сітка, вузли, іскри).
   * band — легша версія для темних смуг/CTA (сяйво + іскри, без сітки).
   */
  variant?: "hero" | "band";
  /** Примусово темний регістр (для блоків, які завжди темні, як CTA) */
  forceDark?: boolean;
  className?: string;
};

type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Spark = { a: number; b: number; t: number; speed: number };
type Glow = { hue: [number, number, number]; ax: number; ay: number; fx: number; fy: number; ph: number; r: number };

/**
 * «Енергетичне поле» — динамічний фон у дусі sparkgrid.ai / tesla.com/megapack.
 *
 * Чотири шари, усі на одному Canvas 2D (без WebGL/Three.js — легко, без
 * залежностей, стабільно в обох темах):
 *  1. Сяйво (aurora): три повільні кольорові плями — смарагд, електрик-синій,
 *     бурштин (палітра ТЗ: #34e5a1 / #6aa8ff / #f59e0b). Реагують на курсор
 *     легким паралаксом.
 *  2. Перспективна сітка «енергомережі» в нижній частині: горизонтальні лінії
 *     біжать до глядача, час від часу проходить яскравий імпульс.
 *  3. Вузли-точки, з'єднані ребрами, коли близько.
 *  4. Іскри — пакети енергії, що пробігають по ребрах між вузлами.
 *
 * Продуктивність: requestAnimationFrame, пауза поза екраном (IntersectionObserver)
 * і в прихованій вкладці, DPR ≤ 2, prefers-reduced-motion → один статичний кадр.
 * Кольори читаються з класу .dark на <html> на кожному кадрі — перемикання
 * теми не перезапускає анімацію.
 */
export function EnergyField({ variant = "hero", forceDark = false, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true; // видимість вкладки + присутність на екрані
    let t = 0;
    let last = performance.now();
    let nodes: Node[] = [];
    let sparks: Spark[] = [];
    let pulse = 0; // позиція яскравого імпульсу по сітці (0..1)
    let pulseTimer = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }; // нормалізовані

    const isDark = () => forceDark || document.documentElement.classList.contains("dark");

    // Палітра ТЗ
    const EMERALD: [number, number, number] = [52, 229, 161];
    const BLUE: [number, number, number] = [106, 168, 255];
    const AMBER: [number, number, number] = [245, 158, 11];

    const glows: Glow[] = [
      { hue: EMERALD, ax: 0.22, ay: 0.35, fx: 0.00011, fy: 0.00017, ph: 0, r: 0.55 },
      { hue: BLUE, ax: 0.78, ay: 0.25, fx: 0.00009, fy: 0.00013, ph: 2.1, r: 0.5 },
      { hue: AMBER, ax: 0.6, ay: 0.85, fx: 0.00007, fy: 0.0001, ph: 4.2, r: 0.35 },
    ];

    const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas!.width = Math.max(1, Math.floor(w * dpr));
      canvas!.height = Math.max(1, Math.floor(h * dpr));
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = w < 640 ? 26000 : 14000;
      const count = Math.min(56, Math.max(14, Math.floor((w * h) / density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.8,
      }));
      sparks = [];
    }

    function drawAurora(dark: boolean) {
      // На темному — адитивне змішування дає справжнє «світіння»;
      // на світлому — м'які кольорові плями з низькою насиченістю.
      ctx!.globalCompositeOperation = dark ? "lighter" : "source-over";
      const px = (mouse.x - 0.5) * 0.08;
      const py = (mouse.y - 0.5) * 0.08;
      for (const g of glows) {
        const cx = (g.ax + Math.sin(t * g.fx + g.ph) * 0.12 + px) * w;
        const cy = (g.ay + Math.cos(t * g.fy + g.ph) * 0.1 + py) * h;
        const r = Math.max(w, h) * g.r;
        const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
        const a0 = dark ? 0.22 : 0.16;
        grad.addColorStop(0, rgba(g.hue, a0));
        grad.addColorStop(0.45, rgba(g.hue, a0 * 0.35));
        grad.addColorStop(1, rgba(g.hue, 0));
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, w, h);
      }
      ctx!.globalCompositeOperation = "source-over";
    }

    function drawGrid(dark: boolean, dt: number) {
      // Перспективна «енергомережа» в нижніх ~50% висоти
      const horizon = h * 0.52;
      const vpX = w * (0.5 + (mouse.x - 0.5) * 0.06);
      const depth = h - horizon;
      const base = dark ? EMERALD : ([4, 120, 87] as [number, number, number]);
      const lineA = dark ? 0.16 : 0.1;

      // Вертикалі, що сходяться до точки сходу
      ctx!.lineWidth = 1;
      const cols = 18;
      for (let i = -cols; i <= cols; i++) {
        const xBottom = vpX + (i / cols) * w * 1.4;
        const fade = 1 - Math.abs(i) / (cols + 2);
        ctx!.strokeStyle = rgba(base, lineA * 0.8 * fade);
        ctx!.beginPath();
        ctx!.moveTo(vpX, horizon);
        ctx!.lineTo(xBottom, h);
        ctx!.stroke();
      }

      // Горизонталі, що біжать до глядача
      const rows = 14;
      const scroll = (t * 0.00025) % 1;
      pulseTimer += dt;
      if (pulseTimer > 4200) {
        pulseTimer = 0;
        pulse = 0.001;
      }
      if (pulse > 0) pulse = Math.min(1, pulse + dt * 0.00045);
      for (let i = 0; i <= rows; i++) {
        const k = ((i + scroll) / rows) % 1; // 0 — горизонт, 1 — низ
        const y = horizon + depth * Math.pow(k, 2.2);
        const a = lineA * (0.25 + k * 0.9);
        ctx!.strokeStyle = rgba(base, a);
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
        ctx!.stroke();
      }
      if (pulse > 0 && pulse < 1) {
        const y = horizon + depth * Math.pow(pulse, 2.2);
        const grad = ctx!.createLinearGradient(0, y - 18, 0, y + 18);
        const pc = dark ? EMERALD : ([16, 185, 129] as [number, number, number]);
        grad.addColorStop(0, rgba(pc, 0));
        grad.addColorStop(0.5, rgba(pc, dark ? 0.55 : 0.35));
        grad.addColorStop(1, rgba(pc, 0));
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, y - 18, w, 36);
      }
      if (pulse >= 1) pulse = 0;

      // Маска зверху: сітка розчиняється до горизонту (плавний перехід)
      const fadeGrad = ctx!.createLinearGradient(0, horizon, 0, horizon + depth * 0.35);
      // Використовуємо destination-out, щоб «стерти» верх сітки без знання кольору тла
      ctx!.globalCompositeOperation = "destination-out";
      fadeGrad.addColorStop(0, "rgba(0,0,0,1)");
      fadeGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = fadeGrad;
      ctx!.fillRect(0, horizon - 2, w, depth * 0.35 + 2);
      ctx!.globalCompositeOperation = "source-over";
    }

    function drawNetwork(dark: boolean, dt: number) {
      const dot = dark ? EMERALD : ([4, 120, 87] as [number, number, number]);
      const link = dark ? EMERALD : ([16, 185, 129] as [number, number, number]);
      const R = w < 640 ? 110 : 150;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // Ребра
      const edges: [number, number][] = [];
      ctx!.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < R) {
            edges.push([i, j]);
            const o = (1 - d / R) * (dark ? 0.35 : 0.28);
            ctx!.strokeStyle = rgba(link, o);
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // Вузли
      ctx!.fillStyle = rgba(dot, dark ? 0.7 : 0.55);
      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Іскри: народжуються на випадковому ребрі, пробігають від a до b
      if (edges.length && sparks.length < (w < 640 ? 4 : 9) && Math.random() < dt / 420) {
        const [a, b] = edges[Math.floor(Math.random() * edges.length)];
        sparks.push({ a, b, t: 0, speed: 0.0009 + Math.random() * 0.0008 });
      }
      const sparkC = dark ? ([190, 255, 228] as [number, number, number]) : ([5, 150, 105] as [number, number, number]);
      for (const s of sparks) {
        s.t += dt * s.speed;
        const a = nodes[s.a];
        const b = nodes[s.b];
        const x = a.x + (b.x - a.x) * s.t;
        const y = a.y + (b.y - a.y) * s.t;
        const tx = a.x + (b.x - a.x) * Math.max(0, s.t - 0.18);
        const ty = a.y + (b.y - a.y) * Math.max(0, s.t - 0.18);
        const grad = ctx!.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, rgba(sparkC, 0));
        grad.addColorStop(1, rgba(sparkC, dark ? 0.9 : 0.7));
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.6;
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(x, y);
        ctx!.stroke();
        // Головка іскри зі світінням
        ctx!.fillStyle = rgba(sparkC, dark ? 1 : 0.85);
        ctx!.beginPath();
        ctx!.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx!.fill();
        if (dark) {
          const g2 = ctx!.createRadialGradient(x, y, 0, x, y, 10);
          g2.addColorStop(0, rgba(EMERALD, 0.45));
          g2.addColorStop(1, rgba(EMERALD, 0));
          ctx!.fillStyle = g2;
          ctx!.fillRect(x - 10, y - 10, 20, 20);
        }
      }
      sparks = sparks.filter((s) => s.t < 1);
      ctx!.lineWidth = 1;
    }

    function frame(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      if (!running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      t += dt;
      // Курсор наздоганяє ціль (плавний паралакс)
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      const dark = isDark();
      ctx!.clearRect(0, 0, w, h);
      drawAurora(dark);
      if (variant === "hero") drawGrid(dark, dt);
      drawNetwork(dark, dt);
      raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      mouse.tx = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width)));
      mouse.ty = Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(1, r.height)));
    }
    function onLeave() {
      mouse.tx = 0.5;
      mouse.ty = 0.5;
    }
    let inView = true;
    let tabVisible = true;
    const sync = () => {
      running = inView && tabVisible;
    };
    const onVis = () => {
      tabVisible = document.visibilityState === "visible";
      sync();
    };
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        sync();
      },
      { threshold: 0.01 }
    );

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    io.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);

    if (reduceMotion) {
      // Один статичний кадр — без анімації
      const dark = isDark();
      drawAurora(dark);
      if (variant === "hero") drawGrid(dark, 0);
      drawNetwork(dark, 0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [variant, forceDark]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
