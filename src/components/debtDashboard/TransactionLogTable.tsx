import type { Debt, DebtPayment } from "@/types";
import type { DebtSchemePalette } from "@/lib/debtColorSchemes";
import { useI18n } from "@/lib/i18n";
import { formatRM, formatDate } from "@/lib/bills";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function TransactionLogTable({
  payments,
  debts,
  onEdit,
  palette,
}: {
  payments: DebtPayment[];
  debts: Debt[];
  onEdit: (payment: DebtPayment) => void;
  palette: DebtSchemePalette;
}) {
  const { t, lang } = useI18n();
  const debtName = (id: string) => debts.find((d) => d.id === id)?.name ?? "—";
  const sorted = payments.slice().sort((a, b) => b.date.localeCompare(a.date));

  if (payments.length === 0) {
    return <p className="text-xs text-muted-foreground mt-3">{t("noPaymentsYet")}</p>;
  }

  return (
    <div className="mt-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">{t("fieldPaymentDate")}</TableHead>
            <TableHead className="text-xs">{t("fieldPaymentAmount")}</TableHead>
            <TableHead className="text-xs">{t("fieldPaymentDebt")}</TableHead>
            <TableHead className="text-xs">{t("fieldPaymentDescription")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((p) => (
            <TableRow
              key={p.id}
              className="cursor-pointer"
              onClick={() => onEdit(p)}
            >
              <TableCell className="text-xs whitespace-nowrap">{formatDate(p.date, lang)}</TableCell>
              <TableCell className="text-xs font-medium tabular-nums whitespace-nowrap" style={{ color: palette.accent }}>
                {formatRM(p.amount)}
              </TableCell>
              <TableCell className="text-xs truncate max-w-[140px]">{debtName(p.debtId)}</TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                {p.description || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
