import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AppData,
  Bill,
  CalendarNote,
  Debt,
  WhatsAppConfig,
  Lang,
  ScanConfig,
  ScannedReceipt,
  SyncConfig,
  SyncStatus,
  Theme,
} from "@/types";
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
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";
import { BillFormModal } from "@/components/BillFormModal";
import { DebtFormModal } from "@/components/DebtFormModal";
import { ScanReceiptModal } from "@/components/ScanReceiptModal";
import { NoteFormModal } from "@/components/NoteFormModal";
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
  const [scanConfig, setScanConfig] = useState<ScanConfig>({ url: "", enabled: false });
  const [scanModalOpen, setScanModalOpen] = useState(false);
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
  const [newBillDueDate, setNewBillDueDate] = useState<string | undefined>(undefined);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [newNoteDate, setNewNoteDate] = useState<string | undefined>(undefined);

  const [extraDebtPayment, setExtraDebtPayment] = useState(0);

  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function handleToggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

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

  function handleSaveNote(note: CalendarNote) {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      return exists ? prev.map((n) => (n.id === note.id ? note : n)) : [...prev, note];
    });
    setEditingNote(null);
  }

  function handleDeleteNote(note: CalendarNote) {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
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
    setNotes(data.notes ?? []);
    setExtraDebtPayment(data.extraDebtPayment ?? 0);
    if (data.lang) setLang(data.lang);
    if (data.theme) setTheme(data.theme);
    toast.success(t("dataImportedToast"));
  }

  function handleSaveSyncConfig(config: SyncConfig) {
    setSyncConfig(config);
    toast.success(t("settingsSavedToast"));
  }

  function handleSaveScanConfig(config: ScanConfig) {
    setScanConfig(config);
    toast.success(t("settingsSavedToast"));
  }

  function handleReceiptScanned(result: ScannedReceipt) {
    setEditingBill({
      id: crypto.randomUUID(),
      name: result.merchant,
      amount: result.amount,
      dueDate: result.date ?? new Date().toISOString().slice(0, 10),
      category: result.category,
      recurring: false,
      paid: result.isPaid,
    });
    setBillModalOpen(true);
    toast.success(t("scanSuccessToast"));
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
    pushToCloud(syncConfig, { bills, debts, whatsapp, notificationLog, extraDebtPayment, lang, notes, theme });
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
          setNotes(result.data.notes ?? []);
          setExtraDebtPayment(result.data.extraDebtPayment ?? 0);
          if (result.data.lang) setLang(result.data.lang);
          if (result.data.theme) setTheme(result.data.theme);
          setSyncStatus("synced");
          setLastSyncedAt(result.updatedAt);
        } else {
          await pushCloudState(syncConfig, { bills, debts, whatsapp, notificationLog, extraDebtPayment, lang, notes, theme });
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
      pushToCloud(syncConfig, { bills, debts, whatsapp, notificationLog, extraDebtPayment, lang, notes, theme });
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, debts, whatsapp, notificationLog, lang, notes, extraDebtPayment, theme]);

  const debtRelatedPaidThisMonth = useMemo(() => {
    return bills
      .filter((b) => b.paid && (b.category === "loan" || b.category === "creditCard"))
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bills]);

  const appData: AppData = {
    bills,
    debts,
    lang,
    theme,
    whatsapp,
    notificationLog,
    extraDebtPayment,
    notes,
  };

  function openAddBill(dueDate?: string) {
    setEditingBill(null);
    setNewBillDueDate(dueDate);
    setBillModalOpen(true);
  }

  function openEditBill(bill: Bill) {
    setEditingBill(bill);
    setNewBillDueDate(undefined);
    setBillModalOpen(true);
  }

  function openAddNote(date?: string) {
    setEditingNote(null);
    setNewNoteDate(date);
    setNoteModalOpen(true);
  }

  function openEditNote(note: CalendarNote) {
    setEditingNote(note);
    setNewNoteDate(undefined);
    setNoteModalOpen(true);
  }

  function renderPage() {
    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            bills={bills}
            debts={debts}
            onMarkPaid={handleMarkPaid}
            onOpenAddBill={() => openAddBill()}
            onOpenScanReceipt={() => setScanModalOpen(true)}
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
            onEdit={openEditBill}
            onDelete={handleDeleteBill}
            onOpenAddBill={() => openAddBill()}
            onKanbanChange={handleKanbanChange}
          />
        );
      case "calendar":
        return (
          <CalendarPage
            bills={bills}
            notes={notes}
            onEditBill={openEditBill}
            onAddBill={openAddBill}
            onEditNote={openEditNote}
            onAddNote={openAddNote}
          />
        );
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
        return (
          <Analytics
            debts={debts}
            extraDebtPayment={extraDebtPayment}
            onSetExtraDebtPayment={setExtraDebtPayment}
          />
        );
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
            scanConfig={scanConfig}
            onSaveScanConfig={handleSaveScanConfig}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f6f6f4] dark:bg-background">
      <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          page={page}
          search={search}
          setSearch={setSearch}
          onOpenMobileMenu={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          notificationLog={notificationLog}
        />
        <main className="flex-1 p-4 sm:p-6">{renderPage()}</main>
      </div>

      <BillFormModal
        open={billModalOpen}
        onOpenChange={setBillModalOpen}
        onSave={handleSaveBill}
        initial={editingBill}
        defaultDueDate={newBillDueDate}
      />
      <DebtFormModal
        open={debtModalOpen}
        onOpenChange={setDebtModalOpen}
        onSave={handleSaveDebt}
        initial={editingDebt}
      />
      <NoteFormModal
        open={noteModalOpen}
        onOpenChange={setNoteModalOpen}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        initial={editingNote}
        defaultDate={newNoteDate}
      />
      <ScanReceiptModal
        open={scanModalOpen}
        onOpenChange={setScanModalOpen}
        scanConfig={scanConfig}
        token={syncConfig.token}
        onScanned={handleReceiptScanned}
        onGoToSettings={() => setPage("settings")}
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
