# Übergabe / Kontext für einen neuen Chat (PRIDE)

**Schnellstart morgen:** `NEUER_CHAT_START.md` öffnen → eine Zeile in den Chat kopieren.

---

## Projekt-Inhaber & Infra (Stand – wichtig)

- **Haupt-User / Admin:** `tb@allesimgriff.de` (aktuell einziger User).
- **Supabase:** Projekt läuft; Auth, DB, Keys; **URL Configuration** für localhost und Netlify ist erledigt (siehe `LOKAL_STARTEN.md` wenn nachgeholfen werden muss).
- **Netlify:** Site z. B. **pride-project**; **Environment variables** (`NEXT_PUBLIC_*`, SMTP o. Ä.) sind angelegt; **Deploy von GitHub**; Stand **Published**.
- **GitHub:** Repo verbunden, Branch **`main`**, Push löst Deploy aus.

**Für die KI:** **Nicht** davon ausgehen, dass Supabase/Netlify „noch gemacht“ werden müssen. Erst einrichten / erklären, wenn der Nutzer ein **konkretes Problem** meldet.

---

## Nutzer: Rolle & Arbeitsweise (verbindlich)

- **Keine Programmierkenntnisse** – der Nutzer **ändert keinen Code**, **tippt keine Befehle freihändig**.
- Er **führt nur aus**, was **kopierbar** ist:
  - **Hyperlinks** → im Browser öffnen,
  - **SQL** → komplett in den Supabase **SQL Editor** einfügen,
  - **PowerShell** → **nummerierte** Schritte, **je ein vollständiger Befehl** im eigenen Codeblock (Inhalt **nur** aus dem Kasten, kein `PS C:\…>`, keine Tabellenreste).
- **Tempo:** **Schritt für Schritt**; **kurz** antworten; **nicht** mit langen Erklärungen oder vielen Punkten auf einmal „zuballern“.
- **Bilder:** der Nutzer arbeitet gern mit Screenshot + „wohin klicken“ – dann **haarklein** Wege beschreiben oder auf `LOKAL_STARTEN.md` verweisen.

---

## So redet die KI mit diesem Nutzer (verbindlich)

- **Kurz**, nur Nötiges, **keine** langen Erklärungen und **keine** ausführlichen Zusammenfassungen am Ende.
- **Wenn der Nutzer etwas tun soll:** immer **explizit** sagen, **was** und **wo**:
  - **Terminal:** Alles, was der Nutzer **im Terminal ausführen** soll, kommt **von der KI** — **nummeriert (1., 2., …)**, **nur ein Befehl pro Schritt**, jeweils **ein eigener** `powershell`-Codeblock mit dem **vollständig kopierbaren** Befehl. Der Nutzer soll **nichts** im Terminal selbst erfinden.
  - **Datei speichern** → explizit sagen (z. B. Strg+S).
  - **Supabase (Browser):** Menüpfad nennen; **wo möglich: SQL zum Kopieren**. **Kein SQL möglich** für: Project URL, API-Keys, **Authentication → URL Configuration** – nur Dashboard-Klicks.
  - **Netlify (Browser):** explizit nennen, wenn nötig.
- **Wenn nichts ausdrücklich gefordert ist:** Nutzer muss **nichts** tun.
- **Secrets / Keys** nie in Chat posten.
- **Git push / Deploy:** nur nach **ausdrücklicher Freigabe** des Nutzers.

---

## So startest du den nächsten Chat (zum Kopieren)

**Eine Zeile (reicht):**

```text
@HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen und danach arbeiten. Deutsch. Meine Arbeitsweise steht darin und in @NEUER_CHAT_START.md – Schritt für Schritt, ich führe nur Links / SQL / kopierte Terminalbefehle aus.
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
| Auth API | `src/app/api/auth/sign-in/`, `sign-up/`, `supabase-reachability/` |
| Supabase | `src/lib/supabase/*`, `src/middleware.ts` |
| Workspaces | `src/app/(dashboard)/workspaces/`, `src/app/actions/workspaces.ts`, `src/lib/workspacePermissions.ts` |
| Navigation | `src/components/layout/navConfig.tsx`, `Sidebar`, `Header` – **Einstellungen**-Hub `/settings` |
| Projekt verschieben | `ProjectWorkspaceMove.tsx`, `moveProjectToWorkspaceAction` in `projects.ts` |
| Neues Projekt / Stammdaten | `NewProjectForm.tsx`, `ProjectStammdaten.tsx`, `EditableProjectLabel.tsx` |
| Kategorien & Präfixe (UI) | `CategoryPrefixesModal.tsx`, `CategoryPrefixesInlinePanel.tsx` – Modal statt eingebettet in Kategorie-Überschrift |
| Migrationen | `supabase/migrations/`, `ALL_MIGRATIONS_ONE_FILE.sql` |

---

## Registrierung vs. Einladung

- **`signUp`** über **`/api/auth/sign-up`**; **Einladung laden** (`invites`) kann noch Browser-Client nutzen.

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

## Stand dieser Datei (März 2026)

- Infra **voll**, Nutzer-Arbeitsweise und **keine Programmierarbeit** dokumentiert.
- Chronologie Login/DNS nur noch **historisch**.
- **Letzte inhaltliche Ergänzung:** Formular **Neues Projekt** / **Stammdaten:** **Kategorie** und **Entwicklungsnummer** stehen **untereinander** (volle Breite); Bearbeitung der Liste **„Kategorien & Präfixe“** nur noch über **eigenes Modal** (Link „Kategorien & Präfixe bearbeiten …“), nicht mehr im Popover der Kategorie-Überschrift. **Keine** neue Supabase-Migration dafür nötig.
- **Cursor-Regeln:** `.cursor/rules/pride-arbeitspartner.mdc` (Deutsch, Terminal nur kopierbar, kein Auto-Push).
