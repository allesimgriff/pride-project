# Übergabe / Kontext für einen neuen Chat (PRIDE)

**Schnellstart:** `UEBERGABEPROTOKOLL_NEUER_CHAT.md` (kurz) + `NEUER_CHAT_START.md` → **eine Zeile** in den Chat kopieren.

---

## Stand der Arbeit (für jeden neuen Chat – zuerst lesen)

**Nicht raten:** Dieser Abschnitt ist die **maßgebliche** Stelle für „wo wir sind“. Die KI liest ihn **vor** weiteren Annahmen.

**Letzte Aktualisierung:** 2026-03-23 (Workspaces, App-/Workspace-Admin, Einladungen, Übergabe neu)

### Arbeitsmodus (Thomas – verbindlich für die KI)

- **Kurz**, nur das Nötigste; **keine** langen Erklärungen, **keine** ausführlichen Zusammenfassungen.
- **Keine Ursachen-/Root-Cause-Vorträge** ohne ausdrücklichen Wunsch; **nur** nächste Schritte. **Nicht belehrend** (siehe `.cursor/rules/pride-arbeitspartner.mdc`).
- **Kein Programmieren:** nur Idee und Feedback; **Ergebnis beurteilen**; Schritte **nur** als **kopierbare** Anweisungen.
- **Eingaben:** Wenn etwas eingetragen/kopiert werden soll → **immer vollständig** (ganzer Befehl, ganze Zeile, ganzes SQL) – **keine** Code-Fragmente.
- **Terminal (PowerShell in Cursor):** Befehle **nummeriert** (**1., 2., …**), **jeweils nur ein Befehl**, **jeweils ein eigenes** Kopierfeld; Nutzer kopiert **nur** den Kasten-Inhalt (siehe Regeln in `.cursor/rules/pride-arbeitspartner.mdc`).
- **Explizit sagen**, wenn Thomas etwas tun soll: **Terminal** (genauer Befehl), **Datei speichern** (z. B. Strg+S), **Supabase** (Browser), **Netlify** (Browser). **Wenn nichts davon genannt ist:** Thomas muss **nichts** tun.
- **Commit/Push/Deploy:** nur wenn Thomas es **ausdrücklich** will oder die KI danach gefragt hat und er zustimmt.
- **Neuer Chat:** zuerst diese Datei + `NEUER_CHAT_START.md` lesen – damit der Chat **alles Wichtige** weiß.

### Wo wir gerade sind

- **Infra:** **Supabase**, **Netlify**, **GitHub** sind eingerichtet. **Ein User / Admin:** `tb@allesimgriff.de`.
- **Repo:** `c:\Users\Beck\pride`, Remote `allesimgriff/pride-project`, Branch üblich **`main`**.
- **Eine Codebasis, zwei Versionen, zwei getrennte Sites:** **PRIDE** und **Handwerker** sind dieselbe App mit unterschiedlicher Oberfläche; sie können **unabhängig** betrieben werden (eigene Netlify-Site, eigene URL, eigene Env).  
  - **PRIDE:** `https://pride-project.netlify.app`  
  - **Handwerker:** `https://handwerker-allesimgriff.netlify.app`  
  Trennung u. a. über **`NEXT_PUBLIC_APP_EDITION`** (`pride` vs `handwerker`) und **`NEXT_PUBLIC_APP_URL`** (jeweils die **eigene** Site-URL).
- **Supabase:** Zielbild ist **eine gemeinsame Datenbank** (Supabase-Projekt **`pride`**): Keys in Netlify für **beide** Sites auf dieses Projekt; ggf. altes Projekt **handwerker-app** nur noch pausiert/unbenutzt. **Lokal:** `.env.local` an **dieselbe** PRIDE-DB; nicht mit fremden Keys überschreiben.
- **Netlify ↔ Supabase:** Extension „Supabase“ kann Keys setzen; **`NEXT_PUBLIC_*`** für Next muss zur laufenden App passen (siehe Code: `src/lib/supabase/public-env.ts` – u. a. Fallback `NEXT_PUBLIC_SUPABASE_DATABASE_URL` wenn nur die Extension-Variablen gesetzt sind).

### Bereits erledigt – im neuen Chat **nicht** erneut erfragen oder „von vorn“ debuggen

- **Edition (PRIDE vs. Handwerker):** `resolveAppEdition()` nutzt **Hostname** (`pride-project.netlify.app` / `handwerker-allesimgriff.netlify.app`) vor `NEXT_PUBLIC_APP_EDITION` — siehe `src/lib/appEdition.ts`. **Login/Register:** Server-Page mit `await resolveAppEdition()` (kein reines `getAppEdition()` auf der Login-Seite).
- **Branding:** Handwerker = **Allesimgriff** (Sidebar, Tab-Metadaten, Projektüberschrift, Login-Texte); PRIDE bleibt PRIDE. **Register:** `register.inviteIntro` mit `{{brand}}`.
- **Globale Mitarbeiter-Einladung (Einstellungen):** entfernt; Hinweis + Link zu Workspaces (`StaffManager.tsx`). **`createInviteAction`** existiert noch im Code, UI ruft es nicht auf.
- **Workspace-Einladungen:** E-Mail über **`sendWorkspaceInviteEmail`** (`src/lib/mail.ts`), Link **`/workspaces/join?token=…`**; **`inviteToWorkspaceAction`** in `workspaces.ts`.
- **Workspace beitreten:** `accept_workspace_invite` — **nur gültiger Token + eingeloggt** (E-Mail-Vergleich entfernt), Migration **`030`**; **028/029** waren Zwischenschritte; maßgeblich ist der Stand in **`030`**.
- **Workspaces-Liste (`/workspaces`):** **App-Admin** (`profiles.role = 'admin'`) sieht **alle** Workspaces; **alle anderen** nur Mitgliedschaften (`listMyWorkspacesAction`). Untertitel: `workspaces.subtitleAppAdmin` / `subtitleMember`.
- **App-Admin:** `tb@allesimgriff.de` per SQL **`UPDATE profiles SET role = 'admin'`** (Migration **`031`** im Repo); nur wirksam, wenn Profil existiert.
- **Workspace-Rolle (Mitglied vs. Workspace-Admin):** getrennt vom App-Admin; in **`workspace_members.role`**. UI: Dropdown in **`WorkspaceDetailClient`** → **`setWorkspaceMemberRoleAction`**; DB braucht **UPDATE-Policy** — Migration **`032`** (`workspace_members_update`). **Ohne** SQL **`032`** in Supabase schlägt Rollenänderung fehl.
- **Mail-Hilfsfunktion:** `resolveMailAppBaseUrl()` in `src/lib/mail.ts`; Staff-Einladung nutzt `resolveMailAppBaseUrl` statt duplizierter Header-Logik in `invites.ts`.

### Aktuelles Problem (nur wenn es wieder auftritt)

**Falls** jemand nach **PRIDE-Einladung** auf **Handwerker-UI** landet: Link-Domain in der Mail, **`NEXT_PUBLIC_APP_URL`** je Netlify-Site, Build-Zeitpunkt, **`GET /api/app-edition`**. Sonst nicht jedes Mal neu aufrollen.

### Erledigt (Referenz)

- **`.env.example`:** Vorlage; **keine** echten Keys. **`.env.local`:** nur PRIDE; KI **nicht** mit Handwerker-Keys überschreiben.
- Git: **`company`** = **`4d44967`** (Firmen-Stand); **`main`** = aktuell; Push/Deploy nur mit Freigabe (siehe Arbeitsmodus oben).

### Noch zu tun / offen (bis erledigt – Liste abarbeiten)

1. **Repo:** Letzte Änderungen (u. a. `workspaces.ts`, `WorkspaceDetailClient`, Migrationen **028–032**) **commit + push + Netlify-Deploy**, falls noch nicht live.
2. **Supabase (SQL Editor):** Migration **`032`** ausführen (UPDATE auf `workspace_members`), falls noch nicht geschehen — **ohne** `032` funktioniert das Rollen-Dropdown nicht.
3. **Supabase Auth:** **Authentication → URL Configuration** für beide Netlify-Domains, falls noch Lücken.
4. **Optional:** E-Mail (Resend/SMTP) je Site testen.

### Vom Nutzer beim nächsten Chat (ein Satz, hier eintragen)

**Aktuell (Thomas):** App-Admin-Modell und Workspace-Rollen sind umgesetzt; nächster Schritt ist **Deploy + SQL 032** falls noch offen; neuer Chat soll **kurz** antworten und **nicht** bereits Erledigtes wieder erfragen.

### Pflicht für die KI

- **„Arbeitsmodus (Thomas)“** und **„Stand der Arbeit“** beachten; **nicht** dieselben Regeln mehrfach in dieser Datei wiederholen (Details: `.cursor/rules/pride-arbeitspartner.mdc`).
- Nach Meilensteinen: Datum, „Wo wir sind“, „Offen“ hier anpassen.
- Satz unter **„Vom Nutzer“** nicht ignorieren.

---

## Nur für die KI: Zwei Supabase / `.env`

- **Keys nie** in den Chat.
- **PRIDE:** `.env.local` (nicht mit Handwerker-Keys überschreiben). **Handwerker:** **Netlify** Env (Supabase Dashboard → kopieren → Netlify).
- Lokale Doppel-Konfiguration nur mit klarem Weg (KI legt Datei an **oder** eigener Ordner) – Thomas keine freie `.env`-Syntax zumuten.

---

## So startest du den nächsten Chat (zum Kopieren)

**Eine Zeile (reicht):**

```text
@HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen – zuerst „Arbeitsmodus (Thomas)“, dann „Bereits erledigt“ (nicht erneut erfragen). Deutsch. Kurz, nur Kopierbares.
```

**Weitere Doku:** `PROJECT-KONTEXT.md`, `LOKAL_STARTEN.md` (lokal + Supabase-Klicks). **Regeln:** `.cursor/rules/pride-arbeitspartner.mdc`.

---

## Technischer Stack (Kurz)

- **Next.js 15.5.x**, React 18, TypeScript, Tailwind, Webpack.
- **Supabase:** Auth, DB, Storage.
- **Deploy:** Netlify (mit GitHub).
- **Lokal:** `http://localhost:3000`, `.env.local` (nicht im Git): u. a. `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_APP_URL` (lokal vs. Production).

---

## Historisch: Login / Supabase-Erreichbarkeit (gelöst)

Früher: falsche **Project URL** (Tippfehler in der Ref), **`fetch failed`**; Reachability-Route fehlte zunächst **`apikey`**-Header (401 „No API key“) – behoben. Bei **ähnlichen Symptomen:** `LOKAL_STARTEN.md` → Reachability-URL; **`npm run clean`** / **`npm run dev:clean`** bei kaputtem `.next`-Cache.

**Korrekte Project-URL:** aus **Project Settings → General → Project ID** ableitbar: `https://<PROJECT_ID>.supabase.co`

---

## Wichtige Pfade (Code)

| Bereich | Dateien |
|--------|---------|
| Auth API | `sign-in/`, `sign-up/` (Route existiert), **`RegisterClient`** nutzt **`createBrowserClient`** für Sign-up; `supabase-reachability/` |
| Supabase | `src/lib/supabase/*`, `src/middleware.ts` |
| Workspaces | `src/app/(dashboard)/workspaces/page.tsx` (App-Admin vs. nur meine), `WorkspaceDetailClient.tsx` (Rollen-Dropdown), `src/app/actions/workspaces.ts` (`setWorkspaceMemberRoleAction`, …), `src/lib/workspacePermissions.ts` |
| Workspace-Einladung Mail | `sendWorkspaceInviteEmail` in `src/lib/mail.ts` |
| Migrationen (Stand) | u. a. **`030`** `accept_workspace_invite` token-only; **`031`** App-Admin-E-Mail; **`032`** `workspace_members` UPDATE policy |
| Navigation | `src/components/layout/navConfig.tsx`, `Sidebar`, `Header` – **Einstellungen**-Hub `/settings` |
| Projekt verschieben | `ProjectWorkspaceMove.tsx`, `moveProjectToWorkspaceAction` in `projects.ts` |
| Neues Projekt / Stammdaten | `NewProjectForm.tsx`, `ProjectStammdaten.tsx`, `EditableProjectLabel.tsx` |
| Kategorien & Präfixe (UI) | `CategoryPrefixesModal.tsx`, `CategoryPrefixesInlinePanel.tsx` – Modal statt eingebettet in Kategorie-Überschrift |
| Migrationen (Ordner) | `supabase/migrations/`, `ALL_MIGRATIONS_ONE_FILE.sql` |

---

## Registrierung vs. Einladung

- **`signUp`** im **Browser** (`src/app/(auth)/register/RegisterClient.tsx` → `createClient` aus `src/lib/supabase/client.ts`), **nicht** über `/api/auth/sign-up` (Route bleibt im Repo für andere Aufrufer). Grund: **PKCE** (siehe nächster Abschnitt).
- Optional **`invite_token`** bei Einladung; nach Bestätigung/Callback RPC **`mark_invite_accepted`** (Migration `027`).
- **Einladung laden** auf `/register`: **`get_invite_for_registration`** (Migrationen `025`/`026`), nicht direkt `invites`-SELECT (RLS: anon).

### Referenz: `/auth/callback`

- **Seite** (`page.tsx` + `AuthCallbackClient.tsx`): Code-Tausch und `verifyOtp` laufen im **Browser** (`createBrowserClient`), nicht nur als Route-Handler — PKCE-Cookies liegen dort.
- Hilfsfunktionen: `src/lib/authCallback.ts`.

### Referenz: PKCE und „Confirm your signup“ (nicht erneut „raten“)

- **Ursache:** Supabase nutzt **PKCE**. Beim Klick auf „Confirm your signup“ muss der **Code-Verifizierer** in **Cookies derselben Browser-Sitzung** liegen wie bei der Registrierung. **`signUp` über `/api/auth/sign-up` (Server)** setzt den Verifizierer oft **nicht zuverlässig im Browser** – dann schlägt **`exchangeCodeForSession`** in **`/auth/callback`** fehl (typisch: Weiterleitung zu **`/login?error=auth`**).
- **Änderung im Code:** Registrierung mit **`createBrowserClient`** direkt im Browser (`RegisterClient`). So werden die PKCE-Cookies beim Signup gesetzt; der Bestätigungslink funktioniert auf **demselben Gerät/Browser**, auf dem registriert wurde.
- **Hinweis:** Registrierung am **PC**, Link nur am **Handy** öffnen → kann **weiterhin** scheitern (kein gemeinsamer Cookie-Speicher). Dann Link im **gleichen Browser** öffnen oder Bestätigung auf dem **Zielgerät** erneut anfordern.

---

## Kurz-Kommandos (Referenz)

Projektordner:

```powershell
Set-Location c:\Users\Beck\pride
```

Dev (nach Problemen mit `.next`):

```powershell
npm run dev:clean
```

Reachability (nur Entwicklung, Browser):

```text
http://localhost:3000/api/auth/supabase-reachability
```

---

## Technische Randnotiz (Migration 011)

- `DROP FUNCTION is_project_member` steht **nach** den abhängigen `DROP POLICY` (in `011_workspaces.sql`, `ALL_MIGRATIONS_ONE_FILE.sql`, `FRESH_DB_STEP3_…`).
