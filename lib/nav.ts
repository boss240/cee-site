export type NavKey =
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
 * Напрями — для кого працює Центр.
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
  { href: "/services", key: "services", ready: true },
  { href: "/projects", key: "projects", ready: false },
  { href: "/blog", key: "blog", ready: false },
  { href: "/knowledge", key: "knowledge", ready: true },
  { href: "/about", key: "about", ready: true },
  { href: "/contacts", key: "contacts", ready: true },
];

/** Повний перелік — використовується у футері */
export const NAV: NavItem[] = [...AUDIENCES, ...SECTIONS];

/** Пункти верхнього рівня в шапці (напрями йдуть окремим списком) */
export const HEADER_NAV: NavItem[] = SECTIONS.filter((i) =>
  ["/services", "/knowledge", "/about", "/contacts"].includes(i.href)
);
