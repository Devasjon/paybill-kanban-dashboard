import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import type { Debt, Lang } from "@/types";
import type { MonthlySchedule } from "@/lib/debtPayoff";
import type { DebtSchemePalette } from "@/lib/debtColorSchemes";
import { useI18n } from "@/lib/i18n";
import { formatRMShort } from "@/lib/bills";
import { totalDebtSummary } from "@/lib/debts";
import { Card, CardContent } from "@/components/ui/card";

const SCHEDULE_CHART_CAP = 360;

export function DebtDashboardCharts({
  debts,
  schedule,
  palette,
  lang,
}: {
  debts: Debt[];
  schedule: MonthlySchedule[];
  palette: DebtSchemePalette;
  lang: Lang;
}) {
  const { t } = useI18n();
  const summary = totalDebtSummary(debts);

  const barData = debts.map((d, i) => ({
    name: d.name.length > 12 ? d.name.slice(0, 11) + "…" : d.name,
    paid: Math.max(0, d.originalAmount - d.currentBalance),
    remaining: Math.max(0, d.currentBalance),
    color: palette.chartBars[i % palette.chartBars.length],
  }));

  const donutData = [
    { name: t("chartProgressPaidLegend"), value: summary.paidOff },
    { name: t("chartProgressRemainingLegend"), value: summary.balanceTotal },
  ];

  const lineData = [
    { month: 0, balance: summary.balanceTotal },
    ...schedule.slice(0, SCHEDULE_CHART_CAP).map((s) => ({ month: s.month, balance: s.totalBalance })),
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm">{t("chartProgressPerDebtTitle")}</h3>
          <div className="h-64 mt-3 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap={16}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => formatRMShort(Number(v))} />
                <Bar dataKey="paid" stackId="a" fill={palette.donutPaid} radius={[0, 0, 0, 0]} name={t("chartProgressPaidLegend")} />
                <Bar dataKey="remaining" stackId="a" fill={palette.progressTrack} radius={[4, 4, 0, 0]} name={t("chartProgressRemainingLegend")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-1 justify-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.donutPaid }} />
              {t("chartProgressPaidLegend")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.progressTrack }} />
              {t("chartProgressRemainingLegend")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm">{t("chartDonutTitle")}</h3>
          <div className="relative h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius="65%"
                  outerRadius="90%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={palette.donutPaid} />
                  <Cell fill={palette.donutRemaining} />
                </Pie>
                <Tooltip formatter={(v) => formatRMShort(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold" style={{ color: palette.donutPaid }}>
                {summary.percent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-black/5 shadow-sm lg:col-span-2">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm">{t("chartDurationTitle")}</h3>
          <div className="h-56 mt-3 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(m: number) => (m === 0 ? t("today") : `${m}`)}
                />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => formatRMShort(v)} />
                <Tooltip
                  formatter={(v) => formatRMShort(Number(v))}
                  labelFormatter={(m) => (Number(m) === 0 ? t("today") : monthsAheadLabel(Number(m), lang))}
                />
                <Area type="monotone" dataKey="balance" stroke={palette.lineStroke} fill={palette.lineFill} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function monthsAheadLabel(months: number, lang: Lang): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString(lang === "ms" ? "ms-MY" : "en-GB", { month: "short", year: "numeric" });
}
