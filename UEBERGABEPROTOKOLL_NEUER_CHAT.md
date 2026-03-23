# Übergabeprotokoll → neuer Chat (PRIDE)

**Stand:** 2026-03-23  
**Zweck:** Der neue Chat soll **nicht bei null** anfangen. Dieses Protokoll + **`HANDOFF_FUER_NEUEN_CHAT.md`** sind die maßgeblichen Quellen.

---

## 1. Pflichtlektüre für die KI (Reihenfolge)

1. **`.cursor/rules/pride-arbeitspartner.mdc`** – Kommunikation, Terminal, keine Keys im Chat, Deploy nur mit Freigabe.  
2. **`HANDOFF_FUER_NEUEN_CHAT.md`** – vollständig: *Arbeitsmodus (Thomas)*, *Wo wir gerade sind*, *Bereits erledigt* (nicht erneut erfragen).  
3. Bei Bedarf: **`PROJECT-KONTEXT.md`**, **`LOKAL_STARTEN.md`** (nur wenn lokal/Setup).

---

## 2. Architektur (Kurzfassung)

| Thema | Inhalt |
|--------|--------|
| Basis | Ein **Git-Repo** (`allesimgriff/pride-project`), eine **Next.js-Codebasis**. |
| Versionen | **PRIDE** und **Handwerker** = gleiche App, andere Oberfläche/Flows (`NEXT_PUBLIC_APP_EDITION`). |
| Betrieb | **Zwei unabhängige Netlify-Sites**, je eigene URL und Env. |
| Daten | **Eine** gemeinsame **Supabase-DB** (Projektname im Dashboard: **pride**); Keys beider Sites auf dieses Projekt. |

**URLs (Production):**

- PRIDE: `https://pride-project.netlify.app`  
- Handwerker: `https://handwerker-allesimgriff.netlify.app`

---

## 3. Zuletzt im Projekt (kurz – Details im HANDOFF)

- **Edition / Branding:** host-basiert; Login/Register mit `resolveAppEdition`; Handwerker = **Allesimgriff**.
- **Einladungen:** keine globale Staff-Einladung; Workspace-Einladung inkl. E-Mail; `accept_workspace_invite` = Token + Login (**030**).
- **Workspaces-Liste:** App-Admin (`profiles.role = admin`) = alle; sonst nur Mitgliedschaften. App-Admin-SQL **031** (`tb@allesimgriff.de`).
- **Workspace-Rolle:** Dropdown + `setWorkspaceMemberRoleAction`; Supabase-Policy **032** nötig.
- **Projektübersicht (`/projects`):** Code nur noch **RLS** (kein `.in(workspace_id)` von `workspace_members`); sonst leere Liste trotz Daten. **SQL 033** = `workspace_members_select` mit `user_id = auth.uid()`.
- **Registrierung / RPC:** **025–027**, PKCE – siehe HANDOFF.

---

## 4. Offen (nur falls noch nicht erledigt)

- **Push + Netlify-Deploy** der letzten Commits; online **`/projects`** als **Mitglied** testen.
- Supabase **032** / **033** nur falls noch nicht ausgeführt.

---

## 5. Eine Zeile für den neuen Chat (kopieren)

```text
@UEBERGABEPROTOKOLL_NEUER_CHAT.md und @HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen – zuerst Arbeitsmodus (Thomas), dann Abschnitt „Bereits erledigt“ (nicht erneut erfragen). Deutsch. Kurz, nur Kopierbares.
```

---

*Ende Protokoll. Ergänzungen nur im HANDOFF pflegen oder hier Datum/„Stand“ anheben.*
