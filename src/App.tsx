import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AppData,
  AuthUser,
  Bill,
  CalendarNote,
  Debt,
  DebtColorScheme,
  DebtPayment,
  WhatsAppConfig,
  ScanConfig,
  ScannedReceipt,
  SyncStatus,
  Theme,
} from "@/types";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { billStatus, nextMonthDate } from "@/lib/bills";
import { debtTypeToBillCategory } from "@/lib/labels";
import { sampleBills, sampleDebts } from "@/lib/sampleData";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { fetchCloudState, pushCloudState, type CloudState } from "@/lib/cloudSync";
import { getStoredToken, storeToken, clearStoredToken, fetchMe, logout as apiLogout } from "@/lib/auth";
import { AuthFlow } from "@/components/auth/AuthFlow";
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
import { Loader2 } from "lucide-react";

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

function AppShell({ user, token, onLogout }: { user: AuthUser; token: string; onLogout: () => void }) {
  const { t, lang, setLang } = useI18n();

  const [bills, setBills] = useState<Bill[]>(() => sampleBills());
  const [debts, setDebts] = useState<Debt[]>(() => sampleDebts());
  const [whatsapp, setWhatsapp] = useState<WhatsAppConfig>({ defaultNumber: "", enabled: false });
  const [notificationLog, setNotificationLog] = useState<AppData["notificationLog"]>([]);

  const [scanConfig, setScanConfig] = useState<ScanConfig>({ enabled: false });
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  // True once the initial pull-or-seed has finished — guards against the
  // auto-push effect firing before we know whether to pull or push first.
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

  const [debtColorScheme, setDebtColorScheme] = useState<DebtColorScheme>("pinkPurple");
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);

  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function handleToggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  async function fireNotification(event: Parameters<typeof sendWhatsAppNotification>[0], bill: Bill) {
    const entry = await sendWhatsAppNotification(event, bill, whatsapp, lang, token);
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
    applyDebtBillPayment(updated);
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
      applyDebtBillPayment(bill);
    }
  }

  function handleSaveDebt(debt: Debt) {
    setDebts((prev) => {
      const exists = prev.some((d) => d.id === debt.id);
      return exists ? prev.map((d) => (d.id === debt.id ? debt : d)) : [...prev, debt];
    });
    setEditingDebt(null);
    syncDebtMinPaymentBill(debt);
  }

  function handleDeleteDebt(debt: Debt) {
    setDebts((prev) => prev.filter((d) => d.id !== debt.id));
    setDebtPayments((prev) => prev.filter((p) => p.debtId !== debt.id));
    setBills((prev) => prev.filter((b) => !(b.debtId === debt.id && !b.paid)));
  }

  function adjustDebtBalance(debtId: string, delta: number) {
    setDebts((prev) =>
      prev.map((d) => (d.id === debtId ? { ...d, currentBalance: Math.max(0, d.currentBalance + delta) } : d))
    );
  }

  // Keeps an auto-generated recurring Bill in sync with a Debt's minimum
  // payment, so it shows up in All Bills / counts toward Dashboard's
  // unpaid total — see types.ts's Bill.debtId doc comment.
  function syncDebtMinPaymentBill(debt: Debt) {
    setBills((prev) => {
      const existingUnpaid = prev.find((b) => b.debtId === debt.id && !b.paid);

      if (!debt.minPayment) {
        return existingUnpaid ? prev.filter((b) => b.id !== existingUnpaid.id) : prev;
      }

      if (existingUnpaid) {
        return prev.map((b) =>
          b.id === existingUnpaid.id
            ? { ...b, name: debt.name, amount: debt.minPayment!, category: debtTypeToBillCategory(debt.type) }
            : b
        );
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: debt.name,
          amount: debt.minPayment,
          dueDate: nextMonthDate(new Date().toISOString().slice(0, 10)),
          category: debtTypeToBillCategory(debt.type),
          recurring: true,
          paid: false,
          debtId: debt.id,
        },
      ];
    });
  }

  // When a Bill linked to a Debt (see Bill.debtId) is marked paid, reduce
  // that Debt's balance and log it in the Transaction Log too — same effect
  // as logging a payment directly from My Debts — then roll the recurring
  // bill forward to next month so it keeps showing up.
  function applyDebtBillPayment(bill: Bill) {
    if (!bill.debtId) return;
    if (!debts.some((d) => d.id === bill.debtId)) return;

    adjustDebtBalance(bill.debtId, -bill.amount);
    setDebtPayments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        debtId: bill.debtId!,
        date: new Date().toISOString().slice(0, 10),
        amount: bill.amount,
        description: t("debtPaymentFromBillDesc"),
      },
    ]);
    setBills((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: bill.name,
        amount: bill.amount,
        dueDate: nextMonthDate(bill.dueDate),
        category: bill.category,
        recurring: true,
        paid: false,
        debtId: bill.debtId,
      },
    ]);
  }

  function handleSaveDebtPayment(payment: DebtPayment) {
    const existing = debtPayments.find((p) => p.id === payment.id);
    if (existing) {
      adjustDebtBalance(existing.debtId, existing.amount); // undo the old entry's effect
      adjustDebtBalance(payment.debtId, -payment.amount); // apply the new entry's effect
      setDebtPayments((prev) => prev.map((p) => (p.id === payment.id ? payment : p)));
      toast.success(t("paymentUpdatedToast"));
    } else {
      adjustDebtBalance(payment.debtId, -payment.amount);
      setDebtPayments((prev) => [...prev, payment]);
      toast.success(t("paymentAddedToast"));
    }
  }

  function handleDeleteDebtPayment(payment: DebtPayment) {
    adjustDebtBalance(payment.debtId, payment.amount);
    setDebtPayments((prev) => prev.filter((p) => p.id !== payment.id));
    toast.success(t("paymentDeletedToast"));
  }

  function handleSetDebtColorScheme(scheme: DebtColorScheme) {
    setDebtColorScheme(scheme);
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

  function handleImport(data: AppData) {
    setBills(data.bills);
    setDebts(data.debts);
    setWhatsapp(data.whatsapp);
    setNotificationLog(data.notificationLog ?? []);
    setNotes(data.notes ?? []);
    setExtraDebtPayment(data.extraDebtPayment ?? 0);
    setDebtColorScheme(data.debtColorScheme ?? "pinkPurple");
    setDebtPayments(data.debtPayments ?? []);
    if (data.lang) setLang(data.lang);
    if (data.theme) setTheme(data.theme);
    toast.success(t("dataImportedToast"));
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

  async function pushToCloud(snapshot: CloudState) {
    setSyncStatus("syncing");
    try {
      const updatedAt = await pushCloudState(token, snapshot);
      setSyncStatus("synced");
      setLastSyncedAt(updatedAt ?? new Date().toISOString());
    } catch {
      setSyncStatus("error");
      toast.error(t("syncFailedToast"));
    }
  }

  function handleSyncNow() {
    pushToCloud({ bills, debts, whatsapp, notificationLog, extraDebtPayment, lang, notes, theme, debtColorScheme, debtPayments });
  }

  // On mount, pull whatever's already synced for this user. If nothing's
  // been synced yet, seed the server with what's on this device instead —
  // either way, this device and the server agree before auto-push (below)
  // starts sending local edits. Sync is always on for a logged-in user —
  // one backend, one token, nothing to configure.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSyncStatus("syncing");
      try {
        const result = await fetchCloudState(token);
        if (cancelled) return;
        if (result.data) {
          setBills(result.data.bills ?? []);
          setDebts(result.data.debts ?? []);
          if (result.data.whatsapp) setWhatsapp(result.data.whatsapp);
          setNotificationLog(result.data.notificationLog ?? []);
          setNotes(result.data.notes ?? []);
          setExtraDebtPayment(result.data.extraDebtPayment ?? 0);
          setDebtColorScheme(result.data.debtColorScheme ?? "pinkPurple");
          setDebtPayments(result.data.debtPayments ?? []);
          if (result.data.lang) setLang(result.data.lang);
          if (result.data.theme) setTheme(result.data.theme);
          setSyncStatus("synced");
          setLastSyncedAt(result.updatedAt);
        } else {
          await pushCloudState(token, { bills, debts, whatsapp, notificationLog, extraDebtPayment, lang, notes, theme, debtColorScheme, debtPayments });
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
    // Runs once per session (token is stable for AppShell's lifetime) — not
    // on every bill/debt edit, those are picked up by the auto-push effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-push local changes to the cloud (debounced) once the initial pull/seed above
  // has settled, so every device that's online converges on the same data.
  useEffect(() => {
    if (!syncReadyRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      pushToCloud({ bills, debts, whatsapp, notificationLog, extraDebtPayment, lang, notes, theme, debtColorScheme, debtPayments });
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, debts, whatsapp, notificationLog, lang, notes, extraDebtPayment, theme, debtColorScheme, debtPayments]);

  // Drives Dashboard's "Total Overall Debt" delta and DebtProgressPanel's
  // "paid this month" callout — must reflect every way a debt balance can
  // go down this month: payments logged directly in My Debts, and paying a
  // debt-linked bill in All Bills (see applyDebtBillPayment above, which
  // logs a DebtPayment for that path too). Previously this only looked at
  // paid Bills in the loan/creditCard categories, so My Debts activity
  // never showed up here — that's the "tidak sync" bug.
  const debtRelatedPaidThisMonth = useMemo(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return debtPayments.filter((p) => p.date.startsWith(yearMonth)).reduce((sum, p) => sum + p.amount, 0);
  }, [debtPayments]);

  const appData: AppData = {
    bills,
    debts,
    lang,
    theme,
    whatsapp,
    notificationLog,
    extraDebtPayment,
    notes,
    debtColorScheme,
    debtPayments,
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
            userName={user.name}
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
            debtColorScheme={debtColorScheme}
            onSetDebtColorScheme={handleSetDebtColorScheme}
            debtPayments={debtPayments}
            onSaveDebtPayment={handleSaveDebtPayment}
            onDeleteDebtPayment={handleDeleteDebtPayment}
          />
        );
      case "analytics":
        return (
          <Analytics
            debts={debts}
            extraDebtPayment={extraDebtPayment}
            onSetExtraDebtPayment={setExtraDebtPayment}
            debtColorScheme={debtColorScheme}
            onSetDebtColorScheme={handleSetDebtColorScheme}
          />
        );
      case "paymentMethods":
        return <ComingSoonPage titleKey="paymentMethodsTitle" subtitleKey="paymentMethodsSubtitle" />;
      case "settings":
        return (
          <Settings
            data={appData}
            onSaveWhatsapp={handleSaveWhatsapp}
            onImport={handleImport}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
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
      <Sidebar
        page={page}
        setPage={setPage}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={user}
        onLogout={onLogout}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          page={page}
          search={search}
          setSearch={setSearch}
          onOpenMobileMenu={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          notificationLog={notificationLog}
          user={user}
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
        token={token}
        onScanned={handleReceiptScanned}
        onGoToSettings={() => setPage("settings")}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

/**
 * Gates the entire app behind login: on mount, validates any stored session
 * token (src/lib/auth.ts) before rendering AppShell; otherwise renders the
 * auth screens (AuthFlow). The whole app requires an account — there's no
 * anonymous/local-only mode anymore.
 */
function AuthGate() {
  const { t } = useI18n();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      setStatus("unauthenticated");
      return;
    }
    fetchMe(stored)
      .then((u) => {
        setToken(stored);
        setUser(u);
        setStatus("authenticated");
      })
      .catch(() => {
        clearStoredToken();
        setStatus("unauthenticated");
      });
  }, []);

  function handleAuthenticated(newToken: string, newUser: AuthUser) {
    storeToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setStatus("authenticated");
  }

  function handleLogout() {
    if (token) apiLogout(token).catch(() => {});
    clearStoredToken();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }

  if (!import.meta.env.VITE_API_BASE_URL) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground max-w-sm">
          VITE_API_BASE_URL is not configured — see .env.example.
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label={t("loading")} />
      </div>
    );
  }

  if (status === "authenticated" && token && user) {
    return <AppShell user={user} token={token} onLogout={handleLogout} />;
  }

  return <AuthFlow onAuthenticated={handleAuthenticated} />;
}

export default function App() {
  return (
    <I18nProvider initialLang="en">
      <AuthGate />
    </I18nProvider>
  );
}
