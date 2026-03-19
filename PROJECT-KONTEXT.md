# PRIDE – Projektkontext für neue Chats

Kurzüberblick, damit ein neuer Chat sofort orientiert ist. **Keine Secrets hier** – Zugangsdaten nur in `.env.local` / Netlify / Supabase.

## Produkt & Zielgruppe

Interne Plattform **„Produktentwicklung Polstermöbel“** (PRIDE): Projekte, Dateien, Fotos, Checklisten, Timeline, Mitarbeiter, Einladungen.

## Stack

- **Frontend:** Next.js 15, TypeScript, React 18, Tailwind  
- **Backend/Daten:** Supabase (Auth, Postgres, Storage, RLS)  
- **Hosting:** Netlify (Auto-Deploy von `main`)  
- **E-Mail:** SMTP (z. B. IONOS), teils `nodemailer` in `src/lib/mail.ts`

## Wichtige URLs (Stand aus Dokumentation)

- **Live:** https://pride-project.netlify.app  
- **Supabase-Projekt:** Projekt-Dashboard unter [supabase.com](https://supabase.com) (URL/K Keys in `.env.local`)

## Repo & Branching

- **`main`:** produktiver Stand (ohne Stripe/Payment).  
- **Payment:** Arbeit auf Branch `feature/payments-stripe` – **nicht** ignorierend mit `main` mischen ohne Absprache.

## Datenbank

- SQL-Migrationen: `supabase/migrations/` (z. B. `project_labels`, Admin-Policies, `invites` DELETE).  
- Nach Schema-Änderungen: Migration in Supabase ausführen, falls noch nicht eingespielt.

## Kern-Funktionen (stabil auf main)

- Login / Logout, Registrierung inkl. **Invite** (`/register?token=…`), E-Mail-Bestätigung über Supabase.  
- **Projekte:** Liste, Detail, Stammdaten, Kategorien, Status; **Projektbild** & Galerie (Storage `project-photos`, private Auslieferung über API).  
- **Dashboard:** KPIs (aktive Projekte, offene Aufgaben, letzte Änderungen), **Aktuelle Projekte** (Timeline, scrollbar, **Vorschaubild** wie Projektliste), Aufgaben-Liste, Änderungs-Feed.  
- **Admin:** Mitarbeiter (Rollen, Einladungen widerrufen), **Überschriften** (`project_labels`, DE/EN), Kategorien; nur Admin bearbeitet projekt-Stammdaten-Felder (ohne Zielpreis).  
- **Checkliste:** u. a. Massen-Import aus Text (`addTasksBulkAction`).  
- **Drucken:** Print-Styles + Drucken auf Detailseite / Dateien (Stand je nach letztem Deploy).

## Wichtige Pfade im Code

| Bereich | Pfad (Auswahl) |
|--------|-----------------|
| Dashboard | `src/app/(dashboard)/dashboard/`, `src/components/dashboard/DashboardContent.tsx` |
| Projekte | `src/app/(dashboard)/projects/`, `src/components/projects/`, `src/app/actions/projects.ts` |
| Layout / Nav | `src/components/layout/Sidebar.tsx`, `Header.tsx`, `DashboardShell.tsx` |
| i18n | `src/lib/i18n.ts` |
| Supabase Server | `src/lib/supabase/server.ts`, `middleware.ts` |
| Netlify | `netlify.toml` (Next-Plugin) |

## Lokale Entwicklung

- `npm run dev` – Dev-Server (typ. Port 3000).  
- Bei seltsamen Build-/Chunk-Fehlern: `npm run clean` oder `npm run dev:clean` (löscht `.next` u. a.).  
- PowerShell: Befehle **nicht** mit `&&` verketten; lieber **Zeile für Zeile** oder `;`.

## Arbeitsabmachungen mit dem Auftraggeber

- Antworten **auf Deutsch**, **kurz**; keine langen Fachvorträge, wenn nicht gefragt.  
- **Kein automatisches Git-Push/Deploy** – erst nach **expliziter Freigabe**.  
- **Terminal:** Wenn möglich, Befehle im Chat ausführen; der Nutzer möchte nicht immer selbst tippen. Erklärungen nur auf Wunsch.  
- Bei **404 / lädt nicht:** Cache `.next`, Deploy-Status auf Netlify, ggf. Register-Route / Suspense (siehe Git-Historie).

## Nützliche Dateien

- `DEPLOYMENT-NOTIZEN.md` – Repo/Deploy-Hinweise (URLs ggf. aktualisieren).  
- Diese Datei **`PROJECT-KONTEXT.md`** – beim Start eines neuen Chats kurz lesen oder per `@` einbinden.

*Zuletzt sinnvoll ergänzt für nahtlose Chat-Fortsetzung.*
