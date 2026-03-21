# PRIDE – Projektkontext für neue Chats

Kurzüberblick, damit ein neuer Chat sofort orientiert ist. **Keine Secrets hier** – Zugangsdaten nur in `.env.local` / Netlify / Supabase.

## Produkt & Zielgruppe

Interne Plattform **PRIDE** (Kopfzeile standardmäßig „Projektname“ / anpassbar): Projekte, Dateien, Fotos, Checklisten, Timeline, Mitarbeiter, Einladungen.

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
- **`011_workspaces.sql`:** **Workspaces** (Gruppen), **Mitglieder** (`workspace_members`, Rollen `admin`/`member`), **Einladungen** (`workspace_invites`); Projekte haben **`workspace_id`**; Sichtbarkeit/Bearbeitung von Kommentaren, Dateien, Aufgaben u. a. über `project_accessible`; **Projekt-Zeile** (`projects`): INSERT für Mitglieder des Workspace (und App-Admin), UPDATE/DELETE nur **Workspace-Admin** oder **App-Admin** (Stammdaten/Projektbild).  
- **`012_project_rls_workspace_admin_updates.sql`:** Feinjustierung **INSERT** (App-Admin ohne Workspace-Mitgliedschaft) und **UPDATE** auf `projects` nur für App-/Workspace-Admin.  
- Neuere/historische Migrationen (z. B. `010_…`) können ältere RLS ersetzt haben – **Reihenfolge beim Einspielen beachten**.  
- Neue Projekte: `created_by` = anlegender User, **`workspace_id`** Pflicht (siehe `createProjectAction`, Formular „Neues Projekt“).  
- Nach Schema-Änderungen: Migration in Supabase ausführen, falls noch nicht eingespielt.

## Kern-Funktionen (stabil auf main)

- Login / Logout, Registrierung inkl. **Invite** (`/register?token=…`), E-Mail-Bestätigung über Supabase.  
- **Projekte:** Liste, Detail, Stammdaten, Kategorien, Status; **Projektbild** & Galerie (Storage `project-photos`, private Auslieferung über API). Einstieg nach Login: **Projektliste** (`/projects`; `/dashboard` leitet dorthin um).  
- **Workspaces:** `/workspaces` – anlegen, Mitglieder, Einladung per E-Mail (Link `/workspaces/join?token=…`); alle Mitglieder sehen alle Projekte des Workspace.  
- **Admin (App):** Mitarbeiter (Rollen, Einladungen widerrufen), **Überschriften** (`project_labels`, DE/EN), Kategorien; **Stammdaten** am Projekt: **Workspace-Admin** oder **App-Admin**.  
- **Checkliste:** u. a. Massen-Import aus Text (`addTasksBulkAction`).  
- **Drucken:** Print-Styles + Drucken auf Detailseite / Dateien (Stand je nach letztem Deploy).

## Wichtige Pfade im Code

| Bereich | Pfad (Auswahl) |
|--------|-----------------|
| Projekte | `src/app/(dashboard)/projects/`, `src/components/projects/`, `src/app/actions/projects.ts` |
| Überschriften | Global: `project_labels` / `settings/labels`; pro Workspace: `workspace_project_labels` – **nur App-Admin** (global und Overrides); Bearbeitung **inline** auf Projektseite / „Neues Projekt“ (Text oder Stift). u. a. `headerTitle` (20), `categoriesPrefixFootnote` (21) unter Kategorien. Alte URL `workspaces/[id]/labels` → Redirect zur Workspace-Übersicht. |
| Kategorien | `project_categories` (Defaults in `004`/`019`, Liste in `src/lib/projectCategoryDefaults.ts`), `settings/categories`; auf Projektseite/Neues Projekt: Bearbeitung **Name/Präfix** per Modal (`CategoryPrefixesModal` + `CategoryPrefixesInlinePanel`), nicht in der Kategorie-Überschrift eingebettet |
| Workspaces | `src/app/(dashboard)/workspaces/`, `src/app/actions/workspaces.ts`, `src/lib/workspacePermissions.ts` |
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

*Zuletzt ergänzt: Handoff-Dateien `HANDOFF_FUER_NEUEN_CHAT.md`, `NEUER_CHAT_START.md` (März 2026) auf aktuellen Stand – siehe dort „Stand dieser Datei“.*
