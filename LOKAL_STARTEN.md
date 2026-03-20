# PRIDE lokal starten – Schritt für Schritt (ohne Programmierkenntnisse)

**Bitte von oben nach unten durchgehen.** Nichts überspringen, wenn dort „STOP“ steht.

Wenn du unsicher bist: lieber **anhalten** und nachfragen, statt raten.

---

## Wo musst **du** etwas tun?

| | Ort | Wann |
|---|-----|------|
| **🖥️ Cursor** | Terminal + Datei **`.env.local`** bearbeiten | Teil **A**, Teil **C** |
| **🌐 Supabase (Browser)** | Website **supabase.com** → dein Projekt | Teil **B** komplett **und** beim Ausfüllen von **A4** (URL + Key von dort kopieren) |
| **🌍 Browser (normal)** | Nur die Adresse **`http://localhost:3000`** öffnen | Teil **C4** (wenn die App läuft) |

**Wichtig:** Niemand sonst (auch keine KI) kann **in deinem Supabase-Projekt** klicken oder SQL ausführen – **das kannst nur du** eingeloggt bei Supabase. Sagt der Chat oder diese Datei „**Jetzt Supabase**“, weißt du: **Browser öffnen, supabase.com**.

---

## Teil A – Nur einmal am Anfang: Datei für Zugangsdaten

> **🖥️ Nur Cursor / Terminal – noch nicht Supabase**, außer in **A4** brauchst du kurz den Browser für **Kopieren** der Werte.

### A1. Terminal in Cursor öffnen

Menü **Terminal** → **New Terminal**.

### A2. In den Projektordner wechseln

Kopieren, einfügen, Enter:

```powershell
Set-Location c:\Users\Beck\pride
```

### A3. Leere Vorlage für Zugangsdaten erzeugen

**Nur machen, wenn du noch keine eigene `.env.local` hast**  
(oder wenn du sie absichtlich zurücksetzen willst – dann sind alte Einträge weg).

Kopieren, einfügen, Enter:

```powershell
Copy-Item -Path .env.example -Destination .env.local -Force
```

---

### ⛔ STOP – WICHTIG (bitte lesen)

Nach **A3** darfst du **diesen `Copy-Item`-Befehl nie wieder ausführen**,  
sobald du in **A4** echte Werte eingetragen hast – sonst sind die **wieder gelöscht**.

---

### A4. Zugangsdaten eintragen (im Editor, nicht im Terminal)

> **🌐 Jetzt brauchst du Supabase im Browser:** Einloggen → dein Projekt → **Project Settings** (Zahnrad) → **API**. Dort URL und `anon` Key **kopieren**.  
> Dann zurück nach **Cursor**, Datei **`.env.local`** bearbeiten.

1. In Cursor links im Ordner die Datei **`.env.local`** öffnen
   (liegt unter `c:\Users\Beck\pride`, evtl. erst sichtbar wenn „Alle Dateien“ angezeigt werden).

2. Diese drei Zeilen **wirklich ausfüllen** (nicht die Platzhalter lassen):

   - **`NEXT_PUBLIC_SUPABASE_URL`**  
     → aus Supabase: **Project Settings** (Zahnrad) → **API** → **Project URL**

   - **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**  
     → dieselbe Seite: **`anon` `public`** Key

   - **`NEXT_PUBLIC_APP_URL`**  
     → genau so eintragen:  
       `http://localhost:3000`

3. **Speichern** (Strg+S).

**Erst wenn das erledigt ist**, weiter mit Teil B.

---

## Teil B – Datenbank

> **🌐 JETZT NUR SUPABASE (Browser)** – kein Terminal für Teil B.  
> Öffne **supabase.com**, dein Projekt. Erst wenn Teil B fertig ist, weiter mit Teil C im Terminal.

### B1. SQL-Editor öffnen

Links **SQL Editor** → **New query**.

### B2. Migrationen ausführen

#### Variante **B2-Einfach** (empfohlen, nur **eine** SQL-Datei)

1. In Cursor öffnen: **`c:\Users\Beck\pride\supabase\ALL_MIGRATIONS_ONE_FILE.sql`**
2. **Alles kopieren** (Strg+A, Strg+C)
3. Supabase → **SQL** → **New query** → einfügen → **Run**

**⛔ Wichtig:** Ab dem Abschnitt **011** im Skript muss **mindestens ein Eintrag** in der Tabelle **`public.profiles`** existieren (sonst Fehler).  

**Praxis:** Wenn die Datenbank **noch komplett leer** ist: zuerst unter **Authentication → Users** einen Benutzer anlegen, dann in **Table Editor → profiles** **eine Zeile** mit derselben **UUID** wie der User, **E-Mail** und z. B. Rolle **admin** eintragen – **danach** das große Skript ausführen.  
(Oder: du hattest die App schon genutzt und es gibt mindestens ein Profil – dann reicht **Run** direkt.)

---

#### Variante **B2-Einzeln** (13 kleine Dateien)

Für **jede** Datei unten:

1. In Cursor die Datei im Ordner öffnen:  
   `c:\Users\Beck\pride\supabase\migrations\` + Dateiname  
2. **Alles markieren** (Strg+A), **kopieren** (Strg+C)  
3. In den Supabase SQL Editor **einfügen**  
4. Unten auf **Run** klicken  
5. Warten, bis es ohne rote Fehlermeldung durch ist  

**Reihenfolge** (von oben nach unten, nicht mischen):

1. `001_initial_schema.sql`  
2. `002_fix_handle_new_user.sql`  
3. `003_drop_trigger_create_user.sql`  
4. `004_project_categories.sql`  
5. `005_invites.sql`  
6. `005_project_image.sql`  
7. `006_avatars_bucket.sql`  
8. `007_admin_update_profiles.sql`  
9. `008_invites_delete_policy.sql`  
10. `009_project_labels.sql`  
11. `010_project_owner_rls.sql`  
12. `011_workspaces.sql`  
13. `012_project_rls_workspace_admin_updates.sql`  

**Wenn eine Meldung kommt wie „existiert bereits“:** Diese eine Datei **überspringen** und zur nächsten gehen – deine Datenbank hatte den Schritt vermutlich schon. (Wenn viele Fehler kommen: anhalten und Hilfe holen.)

---

### B3. Login von localhost erlauben (Kurzfassung)

In Supabase links: **Authentication** → **URL Configuration**

- **Site URL:** `http://localhost:3000`  
- Bei **Redirect URLs** eine Zeile hinzufügen: `http://localhost:3000/**`  

**Save**.

**Wenn du jeden Klick brauchst:** weiter unten **„B3 und API: Klick für Klick“**.

---

### B3 und API: Klick für Klick (Supabase im Browser, kein SQL)

**Teil 1 – Einloggen und Projekt öffnen**

1. Browser öffnen.
2. In die Adresszeile eingeben: `https://supabase.com` und Enter.
3. Oben rechts auf **Sign in** klicken (falls du noch nicht eingeloggt bist).
4. E-Mail und Passwort eingeben und anmelden.
5. Du siehst eine **Projektliste** oder das **Dashboard**. Auf den **Eintrag / Namen deines Projekts** klicken (das Projekt, das zu PRIDE gehört).

**Teil 2 – Project URL und anon Key (für `.env.local`)**

6. **Links** in der Seitenleiste nach unten scrollen oder oben am Projektnamen: den Punkt **Project Settings** anklicken (oft ein **Zahnrad**-Symbol).
7. Im **linken** Untermenü von Settings den Punkt **API** anklicken.
8. Auf der Seite den Abschnitt **Project URL** suchen. Daneben steht eine Adresse wie `https://xxxxx.supabase.co`. Auf das **Kopieren-Symbol** neben der URL klicken.
9. **Cursor** öffnen. Die Datei **`c:\Users\Beck\pride\.env.local`** öffnen (Explorer links im Projekt).
10. Die Zeile finden, die mit **`NEXT_PUBLIC_SUPABASE_URL=`** beginnt. **Keinen** Text vor der URL lassen: direkt nach dem **`=`** klicken und mit **Strg+V** einfügen. **Keine** Anführungszeichen um die URL, **kein** Leerzeichen zwischen `=` und `https`.
11. Zurück zum Browser (Tab Supabase). Auf derselben **API**-Seite nach **Project API keys** suchen. Den Key **anon** / **public** (langer Text) mit dem **Kopieren-Symbol** kopieren.
12. In Cursor bei **`NEXT_PUBLIC_SUPABASE_ANON_KEY=`** direkt nach dem **`=`** mit **Strg+V** einfügen. Wieder **ohne** Anführungszeichen.
13. Sicherstellen, dass **`NEXT_PUBLIC_APP_URL=http://localhost:3000`** (eine Zeile, genau so).
14. Datei mit **Strg+S** speichern.

**Teil 3 – Authentication URLs (Login von localhost)**

15. **Links** in der Supabase-Seitenleiste **Authentication** anklicken.
16. Im Menü unter Authentication **URL Configuration** anklicken.
17. Feld **Site URL:** Inhalt löschen und **exakt** eintragen: `http://localhost:3000`
18. Bei **Redirect URLs** auf **Add URL** (oder **Add redirect URL**) klicken.
19. In das neue Feld **exakt** eintragen: `http://localhost:3000/**` (mit `/**` am Ende).
20. Unten auf **Save** klicken.

**Teil 4 – Optional, wenn du Netlify nutzt**

21. Wenn deine Live-Adresse z. B. `https://irgendwas.netlify.app` ist: bei **Redirect URLs** **eine weitere Zeile** hinzufügen: `https://irgendwas.netlify.app/**` (deine **echte** Netlify-URL statt `irgendwas`).
22. Wieder **Save**.

---

## Teil C – Programm installieren und starten

> **🖥️ Wieder NUR Cursor / Terminal** (Supabase für diesen Teil nicht nötig).

Wieder **Terminal** in Cursor, dann **nur diese Befehle**, nacheinander, jeweils Enter nach dem Einfügen.

### C1. Projektordner

```powershell
Set-Location c:\Users\Beck\pride
```

### C2. Einmalig: Pakete laden

```powershell
npm install
```

(Warten bis es fertig ist.)

### C3. App starten

```powershell
npm run dev
```

### C4. Im Browser öffnen

> **🌍 Normaler Browser** (nicht Supabase) – deine lokale App testen.

Adresse eintippen:

```text
http://localhost:3000
```

**Dev-Server beenden:** im Terminal **Strg+C** drücken.

---

## Kurz-Checkliste (zum Abhaken)

- [ ] A2 + A3 gemacht  
- [ ] A4 `.env.local` ausgefüllt und gespeichert  
- [ ] B2 alle Migrationen der Reihe nach (oder übersprungen wenn „existiert schon“)  
- [ ] B3 Auth-URL + Redirect gespeichert  
- [ ] C2 `npm install` ohne Abbruch  
- [ ] C3 `npm run dev` → dann Browser `http://localhost:3000`  

---

## Wenn etwas schiefgeht

| Symptom | Erste Prüfung |
|--------|----------------|
| Login geht nicht | `.env.local` gespeichert? URL/Key richtig? B3 Redirect-URL? |
| **„fetch failed“ / keine Verbindung zu Supabase** | Mit laufendem `npm run dev` im Browser testen: `http://localhost:3000/api/auth/supabase-reachability` (nur **Entwicklung**). Wenn dort `ok: false`: Internet, VPN, Firewall, Supabase-Projekt nicht pausiert. |
| Seite leer / Fehler | Läuft `npm run dev` noch? Terminal offen lassen. |
| Daten fehlen | Teil B Migrationen alle durch? |

Bei Fragen: diese Datei (**`LOKAL_STARTEN.md`**) mitgeben oder den aktuellen Schritt nennen (z. B. „B2, Datei 011“).
