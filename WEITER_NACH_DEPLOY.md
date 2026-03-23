# Weiter nach Deploy (klare Reihenfolge)

**Stand Code auf GitHub:** Branch `main`, zuletzt u. a. **`b70172f`** (enthält u. a. **`f2e2267`**: Auth/Einladung, Staff-UI, PKCE, Migrationen 025–027) plus **`WEITER_NACH_DEPLOY.md`**, Cursor-Regeln, Übergabeprotokoll.

---

## 1. Netlify (Browser)

1. **Site pride-project** öffnen → **Deploys**.
2. **Letzter Deploy** muss **Published** sein und **Commit `f2e2267`** (oder neuer) anzeigen.
3. Wenn nicht: warten oder **Retry deploy** / Push prüfen.

---

## 2. Supabase – nur wenn die Datenbank noch nicht nachgezogen ist

**Wo:** Supabase-Projekt **pride** → **SQL Editor**.

**Aktuell wichtig (Workspace / Projekte):** Falls noch nicht geschehen: **`032`** (Rollen-Dropdown) und **`033`** (`workspace_members_select` – Datei **`033_workspace_members_select_own_row.sql`**) aus dem Repo ausführen.

**Reihenfolge (ältere Einladungs-RPCs):** nacheinander **drei** ausführen (jeweils „Run“), **nicht** alles auf einmal mischen:

| Schritt | Datei im Repo (Inhalt kopieren) |
|--------|----------------------------------|
| A | `supabase/migrations/025_invite_registration_rpc.sql` |
| B | `supabase/migrations/026_invite_registration_rpc_return_text.sql` |
| C | `supabase/migrations/027_mark_invite_accepted.sql` |

**Wenn** Fehler wie „function already exists“: Schritt 026 ist gedacht, 025 zu ersetzen – dann **026** und **027** ausführen (oder nach Supabase-Fehlermeldung handeln).

**Wenn** die Funktionen schon da sind: Schritte überspringen.

---

## 3. Supabase – Auth-URLs (einmalig prüfen)

**Wo:** **Authentication** → **URL Configuration**.

- **Site URL:** `https://pride-project.netlify.app` (oder eure finale PRIDE-URL).
- **Redirect URLs:** mindestens  
  `https://pride-project.netlify.app/**`  
  `https://handwerker-allesimgriff.netlify.app/**`  
  und bei lokalem Test: `http://localhost:3000/**`

---

## 4. Testen (nach 1. grün)

1. **`/projects`:** Als **Workspace-Mitglied** (nicht App-Admin) einloggen → Projekte sichtbar, wenn RLS sie erlaubt (Code + ggf. **033** in Supabase).
2. **Gleicher Browser:** Einladung auslösen → **E-Mail versendet** / Box „E‑Mail versendet“ (kein alter Text „Link kopieren und …“ als alleinige Erfolgsmeldung).
3. Registrierung **auf demselben Gerät/Browser** wie später der Klick auf **„Confirm signup“** (PKCE).
4. Login testen.

---

## Kurz für einen neuen Chat

```text
@HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen. @WEITER_NACH_DEPLOY.md für die Reihenfolge nach Deploy. Deutsch.
```
