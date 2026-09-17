"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Plus, CheckCircle2 } from "lucide-react";

type Labels = {
  companyName: string;
  edrpou: string;
  address: string;
  iban: string;
  bankName: string;
  email: string;
  phone: string;
  vatPayer: string;
  save: string;
  invoices: string;
  addInvoice: string;
  clientName: string;
  amount: string;
  serviceDescription: string;
  downloadPdf: string;
  markPaid: string;
  draft: string;
  sent: string;
  pending: string;
  paid: string;
  overdue: string;
  cancelled: string;
  paymentGateways: string;
  apiKey: string;
  connected: string;
  disconnected: string;
  connect: string;
  disconnect: string;
};

type Company = {
  id: number;
  legalName: string;
  edrpou: string;
  address: string;
  iban: string;
  bankName: string;
  vatPayer: boolean;
  email: string;
  phone: string;
};

type Invoice = {
  id: number;
  number: string;
  clientName: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
};

type Gateway = { id: number; provider: string; isConnected: boolean; apiKeyEnvVar: string | null };

const emptyInvoiceForm = () => ({
  clientName: "",
  amount: 0,
  currency: "UAH",
  serviceDescription: "",
});

export function BillingManager({ labels: l }: { labels: Labels }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [addingInvoice, setAddingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm());

  const load = useCallback(async () => {
    setLoading(true);
    const [companyRes, invoicesRes, gatewaysRes] = await Promise.all([
      fetch("/api/admin/company-profile"),
      fetch("/api/admin/invoices"),
      fetch("/api/admin/payment-gateways"),
    ]);
    const companyData = await companyRes.json();
    const invoicesData = await invoicesRes.json();
    const gatewaysData = await gatewaysRes.json();
    setCompany(companyData.profile);
    setInvoices(invoicesData.invoices ?? []);
    setGateways(gatewaysData.gateways ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCompany() {
    if (!company) return;
    setSavingCompany(true);
    await fetch("/api/admin/company-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    setSavingCompany(false);
  }

  async function addInvoice() {
    await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceForm),
    });
    setAddingInvoice(false);
    setInvoiceForm(emptyInvoiceForm());
    await load();
  }

  async function markPaid(id: number) {
    await fetch(`/api/admin/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    await load();
  }

  async function toggleGateway(g: Gateway) {
    await fetch("/api/admin/payment-gateways", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: g.provider, isConnected: !g.isConnected }),
    });
    await load();
  }

  const statusStyle: Record<Invoice["status"], string> = {
    paid: "bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]",
    sent: "bg-[#fed7aa] text-[#92400e] dark:bg-[#78350f] dark:text-[#fdba74]",
    draft: "bg-[var(--color-line)] text-[var(--color-fg-muted)]",
    overdue: "bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fca5a5]",
  };
  const statusLabel: Record<Invoice["status"], string> = {
    paid: l.paid,
    sent: l.sent,
    draft: l.draft,
    overdue: l.overdue,
  };

  const field = "mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)]";

  if (loading || !company) {
    return (
      <div className="mt-10 flex justify-center">
        <Loader2 className="animate-spin text-[var(--color-fg-muted)]" size={22} aria-hidden />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            {l.companyName}
            <input className={field} value={company.legalName} onChange={(e) => setCompany({ ...company, legalName: e.target.value })} />
          </label>
          <label className="text-sm">
            {l.edrpou}
            <input className={field} value={company.edrpou} onChange={(e) => setCompany({ ...company, edrpou: e.target.value })} placeholder="00000000" />
          </label>
          <label className="text-sm sm:col-span-2">
            {l.address}
            <input className={field} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
          </label>
          <label className="text-sm">
            {l.iban}
            <input className={field} value={company.iban} onChange={(e) => setCompany({ ...company, iban: e.target.value })} />
          </label>
          <label className="text-sm">
            {l.bankName}
            <input className={field} value={company.bankName} onChange={(e) => setCompany({ ...company, bankName: e.target.value })} />
          </label>
          <label className="text-sm">
            {l.email}
            <input className={field} value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
          </label>
          <label className="text-sm">
            {l.phone}
            <input className={field} value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={company.vatPayer}
              onChange={(e) => setCompany({ ...company, vatPayer: e.target.checked })}
            />
            {l.vatPayer}
          </label>
        </div>
        <button
          type="button"
          onClick={saveCompany}
          disabled={savingCompany}
          className="mt-4 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
        >
          {savingCompany ? "…" : l.save}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl">{l.invoices}</h2>
          <button
            type="button"
            onClick={() => setAddingInvoice((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            <Plus size={14} aria-hidden />
            {l.addInvoice}
          </button>
        </div>

        {addingInvoice && (
          <div className="mt-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                {l.clientName}
                <input className={field} value={invoiceForm.clientName} onChange={(e) => setInvoiceForm((f) => ({ ...f, clientName: e.target.value }))} />
              </label>
              <label className="text-sm">
                {l.amount}
                <input type="number" className={field} value={invoiceForm.amount} onChange={(e) => setInvoiceForm((f) => ({ ...f, amount: Number(e.target.value) }))} />
              </label>
              <label className="text-sm sm:col-span-2">
                {l.serviceDescription}
                <input className={field} value={invoiceForm.serviceDescription} onChange={(e) => setInvoiceForm((f) => ({ ...f, serviceDescription: e.target.value }))} />
              </label>
            </div>
            <button onClick={addInvoice} type="button" className="mt-3 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]">
              {l.save}
            </button>
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-line)]">
          <table className="w-full min-w-[560px] text-sm">
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-[var(--color-line)] first:border-t-0">
                  <td className="px-4 py-3 font-medium">{inv.number}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">{inv.clientName}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {inv.amount.toLocaleString()} {inv.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[inv.status]}`}>
                      {statusLabel[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status !== "paid" && (
                        <button
                          type="button"
                          onClick={() => markPaid(inv.id)}
                          aria-label={l.markPaid}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"
                        >
                          <CheckCircle2 size={15} aria-hidden />
                        </button>
                      )}
                      <a
                        href={`/api/admin/invoices/${inv.id}/pdf`}
                        className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"
                      >
                        <Download size={13} aria-hidden />
                        {l.downloadPdf}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl">{l.paymentGateways}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {gateways.map((gw) => (
            <div key={gw.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold capitalize">{gw.provider}</p>
                <span
                  className={`text-xs font-semibold ${gw.isConnected ? "text-[var(--color-brand-text)]" : "text-[var(--color-fg-placeholder)]"}`}
                >
                  {gw.isConnected ? l.connected : l.disconnected}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-fg-placeholder)]">
                {l.apiKey}: {gw.apiKeyEnvVar}
              </p>
              <button
                type="button"
                onClick={() => toggleGateway(gw)}
                className="mt-3 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"
              >
                {gw.isConnected ? l.disconnect : l.connect}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
