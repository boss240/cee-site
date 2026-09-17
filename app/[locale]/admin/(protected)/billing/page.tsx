import { getTranslations } from "next-intl/server";
import { BillingManager } from "./BillingManager";

export default async function AdminBillingPage() {
  const t = await getTranslations("Admin.billing");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">{t("subtitle")}</p>

      <BillingManager
        labels={{
          companyName: t("companyName"),
          edrpou: t("edrpou"),
          address: t("address"),
          iban: t("iban"),
          bankName: t("bankName"),
          email: t("email"),
          phone: t("phone"),
          vatPayer: t("vatPayer"),
          save: t("save"),
          invoices: t("invoices"),
          addInvoice: t("addInvoice"),
          clientName: t("clientName"),
          amount: t("amount"),
          serviceDescription: t("serviceDescription"),
          downloadPdf: t("downloadPdf"),
          markPaid: t("markPaid"),
          draft: t("invoiceStatus.draft"),
          sent: t("invoiceStatus.sent"),
          pending: t("invoiceStatus.pending"),
          paid: t("invoiceStatus.paid"),
          overdue: t("invoiceStatus.overdue"),
          cancelled: t("invoiceStatus.cancelled"),
          paymentGateways: t("paymentGateways"),
          apiKey: t("apiKey"),
          connected: t("connected"),
          disconnected: t("disconnected"),
          connect: t("connect"),
          disconnect: t("disconnect"),
        }}
      />
    </div>
  );
}
