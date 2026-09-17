import path from "node:path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Стандартні шрифти PDF (Helvetica тощо) не мають кириличних гліфів — текст
// накладався б один на одного. DejaVu Sans підтримує кирилицю і йде в
// комплекті ОС (без завантаження ззовні, що важливо в мережево-обмеженому
// середовищі складання).
Font.register({
  family: "DejaVuSans",
  fonts: [
    { src: path.join(process.cwd(), "assets/fonts/DejaVuSans.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "assets/fonts/DejaVuSans-Bold.ttf"), fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "DejaVuSans", color: "#111827" },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  col: { flexDirection: "column", gap: 2 },
  label: { fontSize: 9, color: "#6b7280", textTransform: "uppercase", marginBottom: 2 },
  value: { fontSize: 11, marginBottom: 8 },
  table: { marginTop: 16, borderTop: "1pt solid #e5e7eb" },
  tr: { flexDirection: "row", borderBottom: "1pt solid #e5e7eb", paddingVertical: 8 },
  th: { fontSize: 9, color: "#6b7280", textTransform: "uppercase" },
  cellDesc: { flex: 3 },
  cellAmount: { flex: 1, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, gap: 12 },
  totalLabel: { fontSize: 12, fontWeight: 700 },
  totalValue: { fontSize: 14, fontWeight: 700 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#9ca3af", textAlign: "center" },
  statusBadge: { fontSize: 9, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, alignSelf: "flex-start" },
});

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  sent: "#b45309",
  paid: "#047857",
  overdue: "#b91c1c",
};

export type InvoiceDocumentProps = {
  invoice: {
    number: string;
    clientName: string;
    clientDetails: string | null;
    amount: number;
    currency: string;
    status: string;
    serviceDescription: string;
    issuedAt: string | Date;
    dueAt: string | Date | null;
  };
  company: {
    legalName: string;
    edrpou: string;
    address: string;
    iban: string;
    bankName: string;
    vatPayer: boolean;
    email: string;
    phone: string;
  };
};

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("uk-UA");
}

export function InvoiceDocument({ invoice, company }: InvoiceDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Рахунок {invoice.number}</Text>
        <Text style={styles.subtitle}>
          Дата виставлення: {fmtDate(invoice.issuedAt)}
          {invoice.dueAt ? `   ·   Термін оплати: ${fmtDate(invoice.dueAt)}` : ""}
        </Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Виконавець</Text>
            <Text style={styles.value}>{company.legalName}</Text>
            {!!company.edrpou && <Text style={styles.value}>ЄДРПОУ: {company.edrpou}</Text>}
            <Text style={styles.value}>{company.address}</Text>
            {!!company.iban && <Text style={styles.value}>IBAN: {company.iban}</Text>}
            {!!company.bankName && <Text style={styles.value}>{company.bankName}</Text>}
            <Text style={styles.value}>{company.vatPayer ? "Платник ПДВ" : "Не є платником ПДВ"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Замовник</Text>
            <Text style={styles.value}>{invoice.clientName}</Text>
            {!!invoice.clientDetails && <Text style={styles.value}>{invoice.clientDetails}</Text>}
          </View>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: "#f3f4f6", marginBottom: 8 }]}
        >
          <Text style={{ color: STATUS_COLORS[invoice.status] ?? "#111827" }}>
            {invoice.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, styles.cellDesc]}>Послуга</Text>
            <Text style={[styles.th, styles.cellAmount]}>Сума</Text>
          </View>
          <View style={styles.tr}>
            <Text style={styles.cellDesc}>{invoice.serviceDescription || "Послуги ЦЕЕ"}</Text>
            <Text style={styles.cellAmount}>
              {invoice.amount.toLocaleString("uk-UA")} {invoice.currency}
            </Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Разом до сплати:</Text>
          <Text style={styles.totalValue}>
            {invoice.amount.toLocaleString("uk-UA")} {invoice.currency}
          </Text>
        </View>

        <Text style={styles.footer}>
          {company.legalName} · {company.email} · {company.phone} · Документ згенеровано автоматично
        </Text>
      </Page>
    </Document>
  );
}
