import { db, schema } from "@/lib/db";

export type PublicContacts = {
  legalName: string;
  address: string;
  phone: string;
  email: string;
};

/**
 * Публічні контакти Центру — з профілю компанії, який адміністратор редагує
 * в адмінці (Білінг → реквізити). Якщо БД недоступна — порожні значення,
 * сторінки не падають.
 */
export async function getPublicContacts(): Promise<PublicContacts> {
  try {
    const [p] = await db.select().from(schema.companyProfile).limit(1);
    return {
      legalName: p?.legalName ?? "",
      address: p?.address ?? "",
      phone: p?.phone ?? "",
      email: p?.email ?? "",
    };
  } catch {
    return { legalName: "", address: "", phone: "", email: "" };
  }
}
