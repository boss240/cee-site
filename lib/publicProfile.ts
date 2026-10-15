import { unstable_cache } from "next/cache";
import { db, schema } from "@/lib/db";

export type PublicContacts = {
  legalName: string;
  address: string;
  phone: string;
  email: string;
};

/** Тег кешу; адмінка скидає його після збереження реквізитів (revalidateTag). */
export const PUBLIC_CONTACTS_TAG = "public-contacts";

async function readPublicContacts(): Promise<PublicContacts> {
  // Помилку БД не перетворюємо на успішний порожній результат:
  // під час revalidation Next.js зберігає останні коректні контакти й повторює спробу.
  // На холодному кеші помилка має поширитись, щоб не закешувати порожню сторінку.
  const [p] = await db.select().from(schema.companyProfile).limit(1);
  return {
    legalName: p?.legalName ?? "",
    address: p?.address ?? "",
    phone: p?.phone ?? "",
    email: p?.email ?? "",
  };
}

/**
 * Публічні контакти Центру — з профілю компанії в адмінці (Білінг → реквізити).
 * Десятихвилинний TTL — резерв; після зміни публічних полів тег запускає SWR
 * на наступному запиті. Помилки читання не замінюють останній коректний кеш.
 */
export const getPublicContacts = unstable_cache(readPublicContacts, ["public-contacts"], {
  revalidate: 600,
  tags: [PUBLIC_CONTACTS_TAG],
});
