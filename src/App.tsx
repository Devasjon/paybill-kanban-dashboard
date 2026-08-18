import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { AppData, Bill, Debt, WhatsAppConfig, Lang, SyncConfig, SyncStatus } from "@/types";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { billStatus } from "@/lib/bills";
import { sampleBills, sampleDebts } from "@/lib/sampleData";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { fetchCloudState, pushCloudState, type CloudState } from "@/lib/cloudSync";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Dashboard } from "@/pages/Dashboard";
import { AllBills } from "@/pages/AllBills";
import { Debts } from "@/pages/Debts";
import { CalendarPage } from "@/pages/Calendar";
import { Settings } from "@/pages/Settings";
import { BillFormModal } from "@/components/BillFormModal";
import { DebtFormModal } from "@/components/DebtFormModal";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";

export type Page = "dashboard" | "bills" | "calendar" | "debts" | "analytics" | "paymentMethods" | "settings";

function ComingSoonPage({ titleKey, subtitleKey }: { titleKey: string; subtitleKey: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t(titleKey)}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t(subtitleKey)}</p>
      </div>
      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AppShell() {
  const { t, lang, setLang } = useI18n();

  const [bills, setBills] = useState<Bill[]>(() => sampleBills());
  const [debts, setDebts] = useState<Debt[]>(() => sampleDebts());
  const [whatsapp, setWhatsapp] = useState<WhatsAppConfig>({
    backendUrl: "",
    defaultNumber: "",
    enabled: false,
  });
  const [notificationLog, setNotificationLog] = useState<AppData["notificationLog"]>([]);

  const [syncConfig, setSyncConfig] = useState<SyncConfig>({ url: "", token: "", enabled: false });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  // True once the initial pull-or-seed for the *current* sync config has finished —
  // guards against the auto-push effect firing before we know whether to pull or push first.
  const syncReadyRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [page, setPage] = useState<Page>("dashboard");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  async function fireNotification(event: Parameters<typeof sendWhatsAppNotification>[0], bill: Bill) {
    const entry = await sendWhatsAppNotification(event, bill, whatsapp, lang);
    setNotificationLog((prev) => [...prev, entry]);
  }

  function handleSaveBill(bill: Bill) {
    const isNew = !bills.some((b) => b.id === bill.id);
    setBills((prev) => (isNew ? [...prev, bill] : prev.map((b) => (b.id === bill.id ? bill : b))));
    setEditingBill(null);
    toast.success(t("billAddedToast", { name: bill.name }));
    if (isNew) fireNotification("billAdded", bill);
  }

  function handleMarkPaid(bill: Bill) {
    const updated = { ...bill, paid: true };
    setBills((prev) => prev.map((b) => (b.id === bill.id ? updated : b)));
    toast.success(t("markPaidToast", { name: bill.name }));
    fireNotification("billPaid", updated);
  }

  function handleDeleteBill(bill: Bill) {
    setBills((prev) => prev.filter((b) => b.id !== bill.id));
  }

  function handleKanbanChange(bill: Bill) {
    const prevStatus = billStatus(bills.find((b) => b.id === bill.id) ?? bill);
    setBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
    const newStatus = billStatus(bill);
    if (newStatus === prevStatus) return;
    if (newStatus === "paid") {
      toast.success(t("markPaidToast", { name: bill.name }));
      fireNotification("billPaid", bill);
    }
  }

  function handleSaveDebt(debt: Debt) {
    setDebts((prev) => {
      const exists = prev.some((d) => d.id === debt.id);
      return exists ? prev.map((d) => (d.id === debt.id ? debt : d)) : [...prev, debt];
    });
    setEditingDebt(null);
  }

  function handleDeleteDebt(debt: Debt) {
    setDebts((prev) => prev.filter((d) => d.id !== debt.id));
  }

  function handleSaveWhatsapp(config: WhatsAppConfig) {
    setWhatsapp(config);
    toast.success(t("settingsSavedToast"));
  }

  function handleSetLang(l: Lang) {
    setLang(l);
  }

  function handleImport(data: AppData) {
    setBills(data.bills);
    setDebts(data.debts);
    setWhatsapp(data.whatsapp);
    setNotificationLog(data.notificationLog ?? []);
    if (data.lang) setLang(data.lang);
    toast.success(t("dataImportedToast"));
  }

  function handleSaveSyncConfig(config: SyncConfig) {
    setSyncConfig(config);
    toast.success(t("settingsSavedToast"));
  }

  async function pushToCloud(config: SyncConfig, snapshot: CloudState) {
    setSyncStatus("syncing");
    try {
      const updatedAt = await pushCloudState(config, snapshot);
      setSyncStatus("synced");
      setLastSyncedAt(updatedAt ?? new Date().toISOString());
    } catch {
      setSyncStatus("error");
      toast.error(t("syncFailedToast"));
    }
  }

  function handleSyncNow() {
    if (!syncConfig.enabled || !syncConfig.url || !syncConfig.token) return;
    pushToCloud(syncConfig, { bills, debts, whatsapp, notificationLog, extraDebtPayment: 0, lang });
  }

  // When sync is turned on (or its URL/token change), pull whatever's already on the
  // server first. If nothing's been synced yet, seed the server with what's on this
  // device instead — either way, this device and the server agree before we start
  // auto-pushing local edits below.
  useEffect(() => {
    syncReadyRef.current = false;
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    if (!syncConfig.enabled || !syncConfig.url || !syncConfig.token) {
      setSyncStatus("idle");
      return;
    }

    let cancelled = false;
    (async () => {
      setSyncStatus("syncing");
      try {
        const result = await fetchCloudState(syncConfig);
        if (cancelled) return;
        if (result.data) {
          setBills(result.data.bills ?? []);
          setDebts(result.data.debts ?? []);
          if (result.data.whatsapp) setWhatsapp(result.data.whatsapp);
          setNotificationLog(result.data.notificationLog ?? []);
          if (result.data.lang) setLang(result.data.lang);
          setSyncStatus("synced");
          setLastSyncedAt(result.updatedAt);
        } else {
          await pushCloudState(syncConfig, { bills, debts, whatsapp, notificationLog, extraDebtPayment: 0, lang });
          setSyncStatus("synced");
          setLastSyncedAt(new Date().toISOString());
        }
      } catch {
        if (cancelled) return;
        setSyncStatus("error");
        toast.error(t("syncFailedToast"));
      } finally {
        if (!cancelled) syncReadyRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
    // Deliberately only re-runs when the sync target itself changes, not on every
    // bill/debt edit — those are picked up by the auto-push effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncConfig.enabled, syncConfig.url, syncConfig.token]);

  // Auto-push local changes to the cloud (debounced) once the initial pull/seed above
  // has settled, so every device that's online converges on the same data.
  useEffect(() => {
    if (!syncConfig.enabled || !syncConfig.url || !syncConfig.token) return;
    if (!syncReadyRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      pushToCloud(syncConfig, { bills, debts, whatsapp, notificationLog, extraDebtPayment: 0, lang });
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, debts, whatsapp, notificationLog, lang]);

  const debtRelatedPaidThisMonth = useMemo(() => {
    return bills
      .filter((b) => b.paid && (b.category === "loan" || b.category === "creditCard"))
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bills]);

  const appData: AppData = {
    bills,
    debts,
    lang,
    whatsapp,
    notificationLog,
    extraDebtPayment: 0,
  };

  function renderPage() {
    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            bills={bills}
            debts={debts}
            onMarkPaid={handleMarkPaid}
            onOpenAddBill={() => {
              setEditingBill(null);
              setBillModalOpen(true);
            }}
            onGoToBills={() => setPage("bills")}
            onGoToCalendar={() => setPage("calendar")}
            debtDeltaThisMonth={debtRelatedPaidThisMonth}
            paidDebtThisMonth={debtRelatedPaidThisMonth}
          />
        );
      case "bills":
        return (
          <AllBills
            bills={bills}
            search={search}
            onMarkPaid={handleMarkPaid}
            onEdit={(bill) => {
              setEditingBill(bill);
              setBillModalOpen(true);
            }}
            onDelete={handleDeleteBill}
            onOpenAddBill={() => {
              setEditingBill(null);
              setBillModalOpen(true);
            }}
            onKanbanChange={handleKanbanChange}
          />
        );
      case "calendar":
        return <CalendarPage bills={bills} />;
      case "debts":
        return (
          <Debts
            debts={debts}
            onOpenAddDebt={() => {
              setEditingDebt(null);
              setDebtModalOpen(true);
            }}
            onEdit={(debt) => {
              setEditingDebt(debt);
              setDebtModalOpen(true);
            }}
            onDelete={handleDeleteDebt}
          />
        );
      case "analytics":
        return <ComingSoonPage titleKey="analyticsTitle" subtitleKey="analyticsSubtitle" />;
      case "paymentMethods":
        return <ComingSoonPage titleKey="paymentMethodsTitle" subtitleKey="paymentMethodsSubtitle" />;
      case "settings":
        return (
          <Settings
            data={appData}
            onSaveWhatsapp={handleSaveWhatsapp}
            onSetLang={handleSetLang}
            onImport={handleImport}
            syncConfig={syncConfig}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
            onSaveSyncConfig={handleSaveSyncConfig}
            onSyncNow={handleSyncNow}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f6f6f4" }}>
      <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar page={page} search={search} setSearch={setSearch} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{renderPage()}</main>
      </div>

      <BillFormModal
        open={billModalOpen}
        onOpenChange={setBillModalOpen}
        onSave={handleSaveBill}
        initial={editingBill}
      />
      <DebtFormModal
        open={debtModalOpen}
        onOpenChange={setDebtModalOpen}
        onSave={handleSaveDebt}
        initial={editingDebt}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider initialLang="en">
      <AppShell />
    </I18nProvider>
  );
}
