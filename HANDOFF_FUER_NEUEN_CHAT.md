# Übergabe / Kontext für einen neuen Chat (PRIDE)

---

## Projekt-Inhaber & Infra (Stand)

- **Haupt-User / Admin:** `tb@allesimgriff.de` (aktuell einziger User).
- **Supabase, Netlify, GitHub:** laut Nutzer eingerichtet.

---

## So redet die KI mit diesem Nutzer (verbindlich)

- **Kurz**, nur Nötiges, **keine** langen Erklärungen und **keine** ausführlichen Zusammenfassungen.
- **Wenn der Nutzer etwas tun soll:** immer **explizit** sagen, **was** und **wo**:
  - **Terminal:** Alles, was der Nutzer **im Terminal ausführen** soll, kommt **von der KI** — **nummeriert (1., 2., …)**, **nur ein Befehl pro Schritt**, jeweils **ein eigener** `powershell`-Codeblock mit dem **vollständig kopierbaren** Befehl (keine Fragmente, keine „tippe nslookup …“ ohne vollen Befehl). Der Nutzer soll **nichts** im Terminal selbst erfinden oder ergänzen.
  - **Datei speichern** (z. B. `.env.local`) → explizit sagen.
  - **Supabase** (Webbrowser) → explizit sagen, inkl. Menüpfad. **Wo möglich: SQL zum Kopieren** für den SQL Editor. **Ausnahme (kein SQL):** Project URL, API-Keys, **Authentication → URL Configuration** — nur Dashboard.
  - **Netlify** (Webbrowser) → explizit sagen.
- **Wenn nichts ausdrücklich gefordert ist:** Nutzer muss **nichts** tun.
- **Secrets / Keys** nie in Chat posten; nur in `.env.local` oder Hosting-Dashboard eintragen.

---

## So startest du den nächsten Chat (zum Kopieren)

**Option A – eine Zeile:**

```text
Lies die Datei HANDOFF_FUER_NEUEN_CHAT.md im Repo vollständig und arbeite danach. Antworten auf Deutsch. Befehle wie in .cursor/rules/pride-arbeitspartner.mdc.
```

**Option B – Datei anhängen:** Im Chat `@HANDOFF_FUER_NEUEN_CHAT.md` verwenden (und ggf. `@LOKAL_STARTEN.md` bei Setup).

**Weitere Projekt-Doku:** `PROJECT-KONTEXT.md` (Gesamtüberblick), `LOKAL_STARTEN.md` (lokal starten, Schritt für Schritt). **Regeln:** `.cursor/rules/pride-arbeitspartner.mdc` (immer aktiv).

---

## Nutzer & Kommunikation

- **Sprache:** Deutsch.
- **Erfahrung:** programmiert wenig → **nummerierte Schritte**, **PowerShell-Befehle jeweils in eigenem Codeblock**, **nur Inhalt des Kastens** ins Terminal (**kein** `PS C:\…>`, keine Tabellenreste, keine Fehlermeldung als „Befehl“).
- **Struktur:** wo sinnvoll **WAS · WO · NUR DIES** (Regeldatei).
- **Secrets:** keine Keys in Chat posten; nur `.env.local` / Supabase-Dashboard.
- **Deploy/Push:** nur auf ausdrückliche Freigabe.

---

## Technischer Stack (Kurz)

- **Next.js 15.5.x** (Webpack), React 18, TypeScript, Tailwind.
- **Supabase:** Auth (Login), DB, Storage.
- **Deploy:** Netlify (u. a. `pride-project.netlify.app` – laut früherem Kontext).
- **Lokal:** `http://localhost:3000`, `.env.local` mit u. a.  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`

---

## Chronologie des Problems (dieser Verlauf)

1. **Browser:** `TypeError: Failed to fetch` bei `signInWithPassword` auf der Login-Seite.
2. **Anpassungen:** u. a. Env-`.trim()`, Middleware-Cookies (Supabase-SSR), Login über **Server-API** statt direkt Supabase im Client.
3. **Weiterer Fehler:** `fetch failed` – auch von Node/Server.
4. **Diagnose:** `GET /api/auth/supabase-reachability` (nur **Entwicklung**) →  
   `getaddrinfo ENOTFOUND` für Host **`zcdaxjfpszpatupjjbgx.supabase.co`**.
5. **DNS-Check:** Mit **8.8.8.8** ebenfalls **Non-existent domain** → der Hostname **existiert global nicht** (kein „nur Fritzbox-DNS“-Spezialfall).
6. **Folgerung:** **`NEXT_PUBLIC_SUPABASE_URL` in `.env.local` war faktisch ungültig** (falscher/ref-Typo/veraltetes/unrichtiges Projekt). **Kein Secret-Key-Problem.**

**Offener Schritt für den Nutzer:** Im **Supabase-Dashboard** (richtiges Projekt) **Project URL** und **öffentlichen** Key (**anon public** oder **Publishable**) **neu kopieren**, in `.env.local` eintragen, speichern, `npm run dev` neu starten, Reachability erneut prüfen bis **`"ok": true`**.

**Wichtig:** **`Copy-Item .env.example .env.local`** nicht wieder ausführen, wenn echte Werte drinstehen – überschreibt sie (**siehe LOKAL_STARTEN.md STOP**).

**Supabase Auth:** **Authentication → URL Configuration:** Site URL + Redirects für `http://localhost:3000/**` und Production-URL (z. B. Netlify) – siehe **LOKAL_STARTEN.md B3**.

---

## Geänderte / neue Dateien (Code-Stand)

| Datei | Zweck |
|--------|--------|
| `src/lib/supabase/public-env.ts` | Trim für `NEXT_PUBLIC_*`, zentrale Leselogik |
| `src/lib/supabase/network-error.ts` | Technische Fehlertexte (fetch/cause) |
| `src/lib/supabase/client.ts` | Nutzt `getPublicConfig()`, klare Fehlermeldung wenn Env fehlt |
| `src/lib/supabase/server.ts` | Nutzt `getPublicConfig()`, Cookie `setAll` mit `options` |
| `src/lib/supabase/middleware.ts` | SSR-Cookies: Request + **Response** (`NextResponse.next` nach Supabase-Doku) |
| `src/app/api/auth/sign-in/route.ts` | **POST** Login serverseitig; Netzwerk-Fehler → **503** + Hinweis Reachability |
| `src/app/api/auth/sign-up/route.ts` | **POST** Registrierung serverseitig; `emailRedirectTo` muss zum Request-**Origin** passen |
| `src/app/api/auth/supabase-reachability/route.ts` | **GET** nur bei `NODE_ENV !== production`, prüft `/auth/v1/health` |
| `src/app/(auth)/login/page.tsx` | Ruft `/api/auth/sign-in` per `fetch` auf (kein Browser-`signInWithPassword`) |
| `src/app/(auth)/register/RegisterClient.tsx` | `signUp` per `/api/auth/sign-up`; Einladungs-**Select** weiter per Supabase-Client |
| `LOKAL_STARTEN.md` | Tabelle „fetch failed“ / Reachability |
| `HANDOFF_FUER_NEUEN_CHAT.md` | diese Übergabe |

**Middleware-Einstieg:** `src/middleware.ts` (nicht Repo-Wurzel).

---

## Kurz-Kommandos (Referenz, nicht alles auf einmal ausführen)

Projektordner:

```powershell
Set-Location c:\Users\Beck\pride
```

Dev-Server:

```powershell
npm run dev
```

Diagnose (Browser, nur lokal):

```text
http://localhost:3000/api/auth/supabase-reachability
```

DNS-Test (Host **an echte Project URL aus Dashboard anpassen**):

```powershell
nslookup DEIN-HOSTOHNE-PFAD.supabase.co 8.8.8.8
```

Erwartung bei **richtigem** Projekt: **kein** „Non-existent domain“, sondern **Adresse(n)**.

---

## Registrierung vs. Einladung laden

- **`signUp`** läuft über **`/api/auth/sign-up`** (wie Login über den Server).
- **Einladung per Token** (`invites`-Select) nutzt weiter den **Browser-Supabase-Client** – bei falschem `NEXT_PUBLIC_SUPABASE_URL` schlägt auch das fehl; langfristig ggf. serverseitige Invite-Route.

---

## Stand dieser Datei

- Zusammengetragen aus dem Chat-Verlauf zu Login, Supabase-Erreichbarkeit, DNS **ENOTFOUND** und Repo-Anpassungen.
- Nutzer-Präferenzen und Infra-Stand siehe oben („Projekt-Inhaber“, „So redet die KI“).
- Nach Korrektur von `.env.local` Reachability und Login **neu testen**; bei Erfolg Abschnitt „Chronologie / offener Schritt“ hier als erledigt kennzeichnen.

---

## Rezept: Lokal wieder mit Supabase verbinden (nur wenn Login / Reachability scheitert)

**A – Supabase (Webbrowser, du klickst):** Project wählen → **Project Settings** (Zahnrad) → **API** → **Project URL** und **anon public** (oder **Publishable**) kopieren (nicht in Chat einfügen).

**B – Datei `.env.local` im Projektordner `c:\Users\Beck\pride`:** In Cursor öffnen. Diese drei Zeilen **vollständig** setzen (Werte **ohne** Anführungszeichen; nach dem `=` einfügen):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Datei speichern** (Strg+S).  
**Hinweis:** Wenn `.env.local` noch nicht existiert: **einmal** aus `.env.example` anlegen – **nicht** `Copy-Item` wiederholen, wenn schon echte Keys drinstehen (Überschreiben). Siehe **LOKAL_STARTEN.md**.

**C – Terminal (PowerShell), Befehle nacheinander, jeweils nur den Kasten:**

1. Projektordner:

```powershell
Set-Location c:\Users\Beck\pride
```

2. Falls `npm run dev` noch läuft: im Terminal **Strg+C** (Server stoppen).

3. Server neu starten:

```powershell
npm run dev
```

**D – Browser:**  
`http://localhost:3000/api/auth/supabase-reachability` — es soll **`"ok":true`** erscheinen (kein `ok:false`).  
Dann **`http://localhost:3000/login`** mit `tb@allesimgriff.de` testen.
