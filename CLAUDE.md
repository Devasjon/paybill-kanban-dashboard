# Paybill — Dashboard Reminder Bil & Pengurusan Hutang

Bilingual (EN/BM) WhatsApp-integrated bill reminder & debt management
dashboard, built for Joan (havenleafbubble). React 18 + TypeScript + Vite +
Tailwind CSS + shadcn/ui. Design matches a set of provided screenshots: dark
sidebar (`#17171d`), modern pastel stat cards, Kanban board for bills.

## Quick start

```
pnpm install       # or npm install
pnpm dev           # http://localhost:5173
pnpm build         # production build via Vite (type-checks + bundles)
```

To produce a single self-contained HTML file (no build step needed to open
it — double-click and it runs), use the bundler script from Anthropic's
`web-artifacts-builder` skill (Parcel + html-inline under the hood):

```
bash /root/.claude/skills/synced/web-artifacts-builder/scripts/bundle-artifact.sh
```

This produces `bundle.html` at the project root. It has been verified to
open standalone via `file://` with zero console errors (tested with
Playwright across desktop/tablet/phone viewports).

## Auth (gates the whole app — see `wasender-backend-laravel/CLAUDE.md` for the backend half)

- `src/App.tsx` — `App()` renders `AuthGate`, not `AppShell`, directly.
  `AuthGate` validates any stored session token on mount
  (`getStoredToken()` + `fetchMe()`) before deciding whether to render
  `AuthFlow` (logged out) or `AppShell` (logged in, receives `user`/`token`/
  `onLogout` props). There is no anonymous/local-only mode — every page
  requires a real account.
- `src/lib/auth.ts` — talks to the backend's `/api/auth/*` endpoints (plain
  `fetch`, same style as `cloudSync.ts`). Also owns the session token's
  `localStorage` read/write/clear (`paybill_auth_token`) — see the
  `storage.ts` note below for why this is a deliberate exception.
- `src/components/auth/` (`AuthLayout`, `AuthFlow`, `LanguageToggle`,
  `OtpCodeInput`) + `src/pages/auth/` (`Login`, `Register`, `OtpVerify`,
  `ForgotPassword`, `ResetPassword`) — the two-panel login/register/OTP/
  reset screens. `AuthFlow` is a local `useState`-driven screen switch,
  matching `App.tsx`'s own `Page`-string-switch style — there's no router.
- Every backend call that used to carry a shared `SyncConfig`/`ScanConfig`
  URL+token now just sends the logged-in user's session token as a Bearer
  header, with the base URL coming from `VITE_API_BASE_URL` (see
  `.env.example`) — one backend, one token per user, nothing left to
  configure manually. `WhatsAppConfig`/`ScanConfig` lost their
  `backendUrl`/`url` fields accordingly; see `src/lib/whatsapp.ts`,
  `src/lib/cloudSync.ts`, `src/lib/receiptScan.ts`.

## Architecture

- `src/App.tsx` — `AppShell` (rendered post-login) owns all state (bills,
  debts, WhatsApp config, notification log), wraps everything in
  `I18nProvider` (via the parent `App()`), renders `Sidebar` + `Topbar` +
  the active page, and wires every mutation handler (`onSaveBill`,
  `onMarkPaid`, `onKanbanChange`, etc.) to also call
  `sendWhatsAppNotification()` where relevant. Exports `type Page` which
  `Sidebar.tsx` imports.
- `src/pages/` — `Dashboard.tsx`, `AllBills.tsx` (list + Kanban toggle),
  `Debts.tsx`, `Calendar.tsx`, `Settings.tsx`. `Analytics` and
  `PaymentMethods` are still "coming soon" placeholders in `App.tsx`
  (`ComingSoonPage`) — not yet built out.
- `src/components/` — presentational pieces (`Sidebar`, `Topbar`,
  `StatCard`, `BillRow`, `KanbanBoard`, `BillFormModal`, `DebtFormModal`,
  `RemindersPanel`, `DebtProgressPanel`) plus the full shadcn/ui set in
  `components/ui/`.
- `src/lib/i18n.tsx` — dictionary-based i18n (`en`/`ms`), `useI18n()` hook,
  `t(key, vars?)` with `{varName}` interpolation. All UI strings live here;
  add new keys to **both** dictionaries.
- `src/lib/bills.ts` — `billStatus()` derives status (`upcoming` /
  `dueSoon` / `overdue` / `paid`) purely from `paid` + `dueDate`. Status is
  **never stored independently** — this shapes Kanban drag semantics (see
  below).
- `src/lib/whatsapp.ts` — `sendWhatsAppNotification()` POSTs
  `{ to, text, event, billName }` to `config.backendUrl` (set in Settings).
  **Never calls WasenderAPI directly from the browser** — the Session API
  Key is a secret and must live server-side. See the companion backend
  project (`wasender-backend-laravel/`, sibling folder / separate repo) for
  the server half of this.
- `src/lib/storage.ts` — explicit JSON export/import, still the only way to
  get a full backup or move data outside of Cloud Sync. The original
  "no localStorage anywhere" rule (this app was built to run as a
  Claude-rendered sandboxed artifact where those APIs aren't available) no
  longer holds absolutely: `src/lib/auth.ts` now stores the session token in
  `localStorage` (key `paybill_auth_token`), a deliberate exception now that
  this is a real deployed site with a real, revocable, expiring token — not
  the sandboxed context the original rule was written for. Nothing else
  should use localStorage/sessionStorage without the same justification.
- `src/lib/theme.ts` — color tokens matching the source screenshots:
  `sidebarBg`, `brandPurple`, `categoryTheme`, `statusTheme`,
  `statCardPalette` (4-slot fixed order: lavender/peach/lime/sky).
- `src/types.ts` — all shared types (`Bill`, `Debt`, `WhatsAppConfig`,
  `NotificationLogEntry`, `AppData`, etc.).

## Known build gotchas (already fixed, don't reintroduce)

- **Parcel + `@radix-ui/primitive/is-development`**: Parcel's resolver
  can't handle that package's nested conditional exports. Fixed via the
  `"alias"` field in `package.json` pointing to `src/shims/is-development.js`
  (a one-line shim exporting `IS_DEVELOPMENT = false`). If you touch
  `package.json`, keep that alias. If the bundler build fails on this again,
  clear `.parcel-cache` and `dist` first — stale cache can mask the fix.
- **favicon.svg**: must exist at the project root (not just `public/`) for
  Parcel to find it via `index.html`'s `/favicon.svg` reference.
- **`DialogContent`**: this project's shadcn `dialog.tsx` always renders
  the close button — don't pass a `showCloseButton` prop, it doesn't exist
  on this version of the component and will fail to typecheck.

## State model notes

- Kanban drag-and-drop (`KanbanBoard.tsx`): dropping a card into "Paid" sets
  `paid: true`; dropping out of "Paid" sets `paid: false`. Dropping between
  Upcoming/Due Soon/Overdue is intentionally a no-op — those three are
  purely derived from `dueDate`, so the card visually snaps back. This is
  correct behavior, not a bug.
- `debtDeltaThisMonth` / `paidDebtThisMonth` (passed into `Dashboard`) are
  currently approximated in `App.tsx` as the sum of paid bills in the
  `loan`/`creditCard` categories — there's no real month-over-month debt
  history tracked yet. Worth revisiting if real backend/database persistence
  gets added.

## Not yet built

- Payment Methods page — currently a placeholder.

## Related project

`wasender-backend-laravel/` (delivered separately, own git history) is the
Laravel API backing this app — real per-user accounts (Sanctum + email OTP
via Resend), WhatsApp sends, cloud sync, receipt scanning, and automatic
daily bill reminders. See its own `CLAUDE.md` / `README.md`.
