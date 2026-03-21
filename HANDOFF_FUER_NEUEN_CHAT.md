# Übergabe / Kontext für einen neuen Chat (PRIDE)

**Schnellstart:** `NEUER_CHAT_START.md` öffnen → **eine Zeile** in den Chat kopieren.

---

## Stand der Arbeit (für jeden neuen Chat – zuerst lesen)

**Nicht raten:** Dieser Abschnitt ist die **maßgebliche** Stelle für „wo wir sind“. Die KI liest ihn **vor** weiteren Annahmen.

**Letzte Aktualisierung:** 2026-03-21

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
- **PRIDE (Hauptprodukt):** App im Repo `c:\Users\Beck\pride`; **lokal** mit **`.env.local`** an das **PRIDE-Supabase-Projekt** (`NEXT_PUBLIC_*` + `localhost:3000`). **PRIDE-`.env.local` nicht** mit Handwerker-Keys überschreiben.
- **Handwerker-Linie:** eigenes Supabase-Projekt (z. B. **handwerker-app** / `handwerker_app`) – **DB-Migrationen erledigt** (Reihenfolge: `FRESH_DB_STEP1_001_through_010.sql` → User in Authentication anlegen → `FRESH_DB_STEP2_auth_user_and_profile.sql` → `FRESH_DB_STEP3_011_through_end.sql`). **Gleiche** Next.js-Codebasis wie PRIDE; **andere** Supabase-Keys über **Netlify Env** für die Handwerker-Site.
- **Netlify:** zweite Site für Handwerker **eingerichtet** / **published** (Keys im Dashboard; Repo `allesimgriff/pride-project`, Branch üblich **`main`**). Details bei Bedarf im letzten Deploy-Log / Site-URL in Netlify.

### Erledigt (Referenz)

- Handoff-Regeln: **pro Antwort nur ein Nutzer-Schritt** (außer er will eine Übersicht).
- **`.env.example`:** Vorlage mit Platzhaltern; **keine** echten Keys in dieser Datei.
- **`.env.local`:** nur PRIDE; von der KI **nicht** mit Handwerker-Keys überschreiben.
- Git: Branch **`company`** = Firmen-Stand **`4d44967`**; **`main`** = weiterentwickeln; **Push/Deploy** nur wenn Thomas explizit will (oder KI nach Freigabe).

### Noch zu tun / offen (bis erledigt – Liste abarbeiten)

1. **Live prüfen:** Handwerker-Site in Netlify öffnen; Login/Navigation testen. **`NEXT_PUBLIC_APP_URL`** in Netlify = **echte** `https://…`-URL der Site.
2. **Supabase (Handwerker-Projekt):** **Authentication → URL Configuration** = Netlify-URL (**Site URL** + **Redirect URLs** mit `/**`), falls noch nicht gesetzt.
3. **Optional:** E-Mail (Resend/SMTP in Netlify), wenn **Einladungen** getestet werden sollen.

### Vom Nutzer beim nächsten Chat (ein Satz, hier eintragen)

**Aktuell (Thomas):** Supabase / Netlify / GitHub stehen; nur User `tb@allesimgriff.de`. Handwerker-DB migriert; Handwerker-Site auf Netlify – nächster Fokus: Live-Test + Auth-URLs in Supabase + ggf. E-Mail-Env.

### Pflicht für die KI

- Abschnitt **„Arbeitsmodus (Thomas)“** und **„Stand der Arbeit“** immer mit einbeziehen.
- Nach **erledigten Meilensteinen** diesen Abschnitt **in dieser Datei** aktualisieren: Datum, „Wo wir sind“, „Offen“ anpassen.
- Wenn der Nutzer **einen Satz** unter „Vom Nutzer“ einträgt, **nicht** ignorieren.

---

## Projekt-Inhaber & Infra (Stand – wichtig)

- **Haupt-User / Admin:** `tb@allesimgriff.de` (aktuell einziger User).
- **Supabase (PRIDE / bestehend):** läuft; Auth, DB, Keys; URL-Konfiguration für localhost + Netlify (siehe `LOKAL_STARTEN.md` bei Problemen).
- **Supabase zweites Projekt (`handwerker_app`):** für neuen Produkt-Strang; **Migrationen erfolgreich** über die drei Dateien `supabase/FRESH_DB_STEP1_001_through_010.sql` → `FRESH_DB_STEP2_auth_user_and_profile.sql` → `FRESH_DB_STEP3_011_through_end.sql` (User vor Schritt 2 in Authentication anlegen). **App-Keys** für dieses Projekt noch in Env/Netlify eintragen, wenn die Handwerker-App daran hängen soll.
- **Netlify:** z. B. **pride-project**; Env-Variablen; Deploy von GitHub. **Firmen-/alter Stand:** Branch **`company`** zeigt auf Commit **`4d44967`**; **`main`** = neuere Entwicklung (Push nicht ohne Absprache).
- **GitHub:** `allesimgriff/pride-project`, **`main`** + Branch **`company`**.

**Für die KI:** Infra ist grundsätzlich da. Nur bei **konkretem Problem** oder **neuem Schritt** Details – **nicht** proaktiv „alles erklären“.

### Zwei Supabase-Projekte / `.env` (verbindlich für die KI)

- **Widerspruch vermeiden:** Wenn der Nutzer **nichts tun muss**, darf die KI **nicht** im selben Atemzug sagen: „du musst eine neue `.env` anlegen und füllen“. **Keys gehören nicht** in den Chat.
- **PRIDE** bleibt an **`.env.local`** (nicht überschreiben). **Handwerker / zweites Supabase:** bevorzugt **Netlify Environment variables** (Werte im Browser von Supabase **API settings** kopieren → Netlify einfügen) **ohne** dass der Nutzer „eine zweite .env-Datei von Hand programmiert“.
- Wenn **lokal** zwei Konfigurationen nötig sind: **entweder** die **KI** legt eine **zusätzliche** Env-Datei an und dokumentiert den **einen** Startweg – **oder** es bleibt bei einem Projekt pro Checkout/Ordner. **Nicht** annehmen, dass Thomas **frei** `.env`-Syntax zusammenbaut.

---

## Nutzer: Rolle & Arbeitsweise (verbindlich)

- **Siehe oben:** Abschnitt **„Arbeitsmodus (Thomas)“** – dort ist die Maßgabe.
- **Kein Programmieren** – Idee und Feedback; **Ergebnis beurteilen**, nicht Code schreiben.
- **Schritt für Schritt**; **kurz**; **keine** langen Erklärungen und **keine** ausführlichen Zusammenfassungen.
- **Zum Kopieren:** nur **vollständige** Inhalte (ganzes SQL, ganze Datei, ganzer Befehl) – **keine** Code-Fragmente.
- **Was der Nutzer ausführt:** nur **kopierbar** – Links, **komplettes** SQL, **nummerierte** Terminal-Befehle (**nur ein Befehl pro Kasten**, Inhalt nur aus dem Kasten).
- **Explizit sagen**, wenn er etwas tun soll: **Terminal** (genauer Befehl), **Datei speichern** (z. B. Strg+S), **Supabase** (Browser), **Netlify** (Browser). **Wenn nichts gesagt ist:** er muss **nichts** tun.
- **Secrets/Keys** nie in den Chat.

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
- **Git push / Deploy:** nur nach **ausdrücklicher Freigabe** des Nutzers (oder wenn er die KI ausdrücklich dazu auffordert).
- **Keine Schritt-Listen mit vielen Punkten auf einmal:** Pro Antwort **höchstens eine** Sache, die der Nutzer **jetzt** tun soll (ein Klickpfad, ein Feld, **ein** Terminal-Befehl). Erst wenn das erledigt ist, der nächste Schritt. **Ausnahme:** Nutzer verlangt ausdrücklich eine Übersicht oder „alles auf einmal“.

---

## So startest du den nächsten Chat (zum Kopieren)

**Eine Zeile (reicht):**

```text
@HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen – zuerst Abschnitt „Stand der Arbeit“. Deutsch. Pro Antwort nur EIN Schritt für mich. Sonst wie in @NEUER_CHAT_START.md – kurz, nur Kopierbares.
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
