# Übergabe / Kontext für einen neuen Chat (PRIDE)

**Schnellstart:** `NEUER_CHAT_START.md` öffnen → **eine Zeile** in den Chat kopieren.

---

## Stand der Arbeit (für jeden neuen Chat – zuerst lesen)

**Nicht raten:** Dieser Abschnitt ist die **maßgebliche** Stelle für „wo wir sind“. Die KI liest ihn **vor** weiteren Annahmen.

**Letzte Aktualisierung:** 2026-03-22

### Arbeitsmodus (Thomas – verbindlich für die KI)

- **Kurz**, nur das Nötigste; **keine** langen Erklärungen, **keine** ausführlichen Zusammenfassungen.
- **Kein Programmieren:** nur Idee und Feedback; **Ergebnis beurteilen**; Schritte **nur** als **kopierbare** Anweisungen.
- **Eingaben:** Wenn etwas eingetragen/kopiert werden soll → **immer vollständig** (ganzer Befehl, ganze Zeile, ganzes SQL) – **keine** Code-Fragmente.
- **Terminal (PowerShell in Cursor):** Befehle **nummeriert** (**1., 2., …**), **jeweils nur ein Befehl**, **jeweils ein eigenes** Kopierfeld; Nutzer kopiert **nur** den Kasten-Inhalt (siehe Regeln in `.cursor/rules/pride-arbeitspartner.mdc`).
- **Explizit sagen**, wenn Thomas etwas tun soll: **Terminal** (genauer Befehl), **Datei speichern** (z. B. Strg+S), **Supabase** (Browser), **Netlify** (Browser). **Wenn nichts davon genannt ist:** Thomas muss **nichts** tun.
- **Commit/Push/Deploy:** nur wenn Thomas es **ausdrücklich** will oder die KI danach gefragt hat und er zustimmt.
- **Neuer Chat:** zuerst diese Datei + `NEUER_CHAT_START.md` lesen – damit der Chat **alles Wichtige** weiß.

### Wo wir gerade sind

- **Infra:** **Supabase**, **Netlify**, **GitHub** sind eingerichtet. **Ein User / Admin:** `tb@allesimgriff.de`.
- **Live-Repo (geprüft):** Die **veröffentlichte** PRIDE-Netlify-Site hängt an **`allesimgriff/pride-project`** (Netlify → Site → **Linked repository**). **Nicht** mit älteren Repos (`pride-project-polster`, `pride-project-app`, …) verwechseln – die sind frühere Stände.
- **PRIDE (Hauptprodukt):** App im Repo `c:\Users\Beck\pride`; **lokal** mit **`.env.local`** an das **PRIDE-Supabase-Projekt** (`NEXT_PUBLIC_*` + `localhost:3000`). **PRIDE-`.env.local` nicht** mit Handwerker-Keys überschreiben.
- **Handwerker-Linie:** eigenes Supabase-Projekt (z. B. **handwerker-app** / `handwerker_app`) – **DB-Migrationen erledigt** (Reihenfolge: `FRESH_DB_STEP1_001_through_010.sql` → User in Authentication anlegen → `FRESH_DB_STEP2_auth_user_and_profile.sql` → `FRESH_DB_STEP3_011_through_end.sql`). **Gleiche** Next.js-Codebasis wie PRIDE; **andere** Supabase-Keys über **Netlify Env** für die Handwerker-Site.
- **Netlify:** zweite Site für Handwerker **eingerichtet** / **published** (Keys im Dashboard; Repo `allesimgriff/pride-project`, Branch üblich **`main`**). Details bei Bedarf im letzten Deploy-Log / Site-URL in Netlify.

### Erledigt (Referenz)

- **`.env.example`:** Vorlage; **keine** echten Keys. **`.env.local`:** nur PRIDE; KI **nicht** mit Handwerker-Keys überschreiben.
- Git: **`company`** = **`4d44967`** (Firmen-Stand); **`main`** = aktuell; Push/Deploy nur mit Freigabe (siehe Arbeitsmodus oben).

### Noch zu tun / offen (bis erledigt – Liste abarbeiten)

1. **Live prüfen:** Handwerker-Site in Netlify öffnen; Login/Navigation testen. **`NEXT_PUBLIC_APP_URL`** in Netlify = **echte** `https://…`-URL der Site.
2. **Supabase (Handwerker-Projekt):** **Authentication → URL Configuration** = Netlify-URL (**Site URL** + **Redirect URLs** mit `/**`), falls noch nicht gesetzt.
3. **Optional:** E-Mail (Resend/SMTP in Netlify), wenn **Einladungen** getestet werden sollen.

### Vom Nutzer beim nächsten Chat (ein Satz, hier eintragen)

**Aktuell (Thomas):** Supabase / Netlify / GitHub stehen; nur User `tb@allesimgriff.de`. Handwerker-DB migriert; Handwerker-Site auf Netlify – nächster Fokus: Live-Test + Auth-URLs in Supabase + ggf. E-Mail-Env.

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
@HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen – zuerst „Arbeitsmodus (Thomas)“ und „Stand der Arbeit“. Deutsch. Pro Antwort nur EIN Schritt für mich. Kurz, nur Kopierbares.
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

## Technische Randnotiz (Migration 011)

- `DROP FUNCTION is_project_member` steht **nach** den abhängigen `DROP POLICY` (in `011_workspaces.sql`, `ALL_MIGRATIONS_ONE_FILE.sql`, `FRESH_DB_STEP3_…`).
