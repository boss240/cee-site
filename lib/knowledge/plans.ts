/**
 * Рівні доступу до бази знань. Ціни навмисно не задані — власник впише їх,
 * коли вирішить; до того на сторінці тарифів показується «вартість уточнюється».
 */
export type PlanId = "guest" | "free" | "premium" | "enterprise";

export type Plan = {
  id: PlanId;
  /** запитів до AI-консультації на добу; null = без ліміту (fair use нижче) */
  dailyAsk: number | null;
  /** м'яка межа для необмежених планів */
  fairUseAsk: number;
  /** ціна на місяць; null = уточнюється */
  priceMonth: number | null;
  currency: "UAH" | "EUR";
  /** можливості, що вмикаються планом */
  features: {
    documents: boolean;
    documentSearch: boolean;
    digests: boolean;
    ask: boolean;
    askHistory: boolean;
    analytics: boolean; // аналітичні панелі, експорт
    api: boolean;
  };
};

export const PLANS: Record<PlanId, Plan> = {
  guest: {
    id: "guest", dailyAsk: 3, fairUseAsk: 3, priceMonth: 0, currency: "UAH",
    features: { documents: true, documentSearch: true, digests: true, ask: true, askHistory: false, analytics: false, api: false },
  },
  free: {
    id: "free", dailyAsk: 10, fairUseAsk: 10, priceMonth: 0, currency: "UAH",
    features: { documents: true, documentSearch: true, digests: true, ask: true, askHistory: true, analytics: false, api: false },
  },
  premium: {
    id: "premium", dailyAsk: null, fairUseAsk: 200, priceMonth: null, currency: "UAH",
    features: { documents: true, documentSearch: true, digests: true, ask: true, askHistory: true, analytics: true, api: false },
  },
  enterprise: {
    id: "enterprise", dailyAsk: null, fairUseAsk: 1000, priceMonth: null, currency: "UAH",
    features: { documents: true, documentSearch: true, digests: true, ask: true, askHistory: true, analytics: true, api: true },
  },
};

export function planFor(plan: string | undefined | null, planUntil?: Date | null): Plan {
  const id = (plan ?? "free") as PlanId;
  const p = PLANS[id] ?? PLANS.free;
  // прострочена платна підписка → free
  if ((id === "premium" || id === "enterprise") && planUntil && planUntil.getTime() < Date.now()) return PLANS.free;
  return p;
}
