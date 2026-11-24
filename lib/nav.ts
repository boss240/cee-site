export type NavKey =
  | "directions"
  | "community"
  | "business"
  | "osbb"
  | "developers"
  | "donors"
  | "citizens"
  | "services"
  | "projects"
  | "blog"
  | "knowledge"
  | "calculators"
  | "news"
  | "subscriptions"
  | "about"
  | "contacts";

export type NavItem = {
  href: string;
  /** ключ у Nav.* messages */
  key: NavKey;
  /** false — сторінка ще заглушка */
  ready: boolean;
};

/**
 * Аудиторії — для кого працює Центр.
 * У шапці згорнуті в один пункт «Для кого», щоб не роздувати меню.
 */
export const AUDIENCES: NavItem[] = [
  { href: "/community", key: "community", ready: true },
  { href: "/business", key: "business", ready: true },
  { href: "/osbb", key: "osbb", ready: true },
  { href: "/developers", key: "developers", ready: true },
  { href: "/donors", key: "donors", ready: true },
  { href: "/citizens", key: "citizens", ready: true },
];

/** Решта розділів */
export const SECTIONS: NavItem[] = [
  { href: "/directions", key: "directions", ready: true },
  { href: "/services", key: "services", ready: true },
  { href: "/subscriptions", key: "subscriptions", ready: true },
  { href: "/calculators", key: "calculators", ready: true },
  { href: "/projects", key: "projects", ready: true },
  { href: "/knowledge", key: "knowledge", ready: true },
  { href: "/news", key: "news", ready: true },
  { href: "/about", key: "about", ready: true },
  { href: "/contacts", key: "contacts", ready: true },
];

/** Повний перелік — використовується у футері */
export const NAV: NavItem[] = [...AUDIENCES, ...SECTIONS];

/** Existing useful URLs remain reachable through the tools disclosure and footer. */
export const TOOLS = SECTIONS.filter((item) => ["calculators", "knowledge", "news", "subscriptions"].includes(item.key));

export const HEADER_NAV: { key: NavKey | "audiences" | "tools"; href?: string }[] = [
  { key: "directions", href: "/directions" },
  { key: "services", href: "/services" },
  { key: "audiences" },
  { key: "projects", href: "/projects" },
  { key: "tools" },
  { key: "about", href: "/about" },
  { key: "contacts", href: "/contacts" },
];
