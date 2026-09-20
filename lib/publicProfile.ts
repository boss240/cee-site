import { unstable_cache } from "next/cache";
import { db, schema } from "@/lib/db";

export type PublicContacts = {
  legalName: string;
  address: string;
  phone: string;
  email: string;
};

const EMPTY: PublicContacts = { legalName: "", address: "", phone: "", email: "" };

/** Тег кешу; адмінка скидає його після збереження реквізитів (revalidateTag). */
export const PUBLIC_CONTACTS_TAG = "public-contacts";

async function readPublicContacts(): Promise<PublicContacts> {
  try {
    const [p] = await db.select().from(schema.companyProfile).limit(1);
    return {
      legalName: p?.legalName ?? "",
      address: p?.address ?? "",
      phone: p?.phone ?? "",
      email: p?.email ?? "",
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Публічні контакти Центру — з профілю компанії, який адміністратор редагує
 * в адмінці (Білінг → реквізити). Якщо БД недоступна — порожні значення,
 * сторінки не падають.
 *
 * Футер є на кожній сторінці, тому результат кешується на 10 хвилин (і скидається
 * одразу після редагування в адмінці) — інакше кожен перегляд сторінки робив запит до БД.
 */
export const getPublicContacts = unstable_cache(readPublicContacts, ["public-contacts"], {
  revalidate: 600,
  tags: [PUBLIC_CONTACTS_TAG],
});
