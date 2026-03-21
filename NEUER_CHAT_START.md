# Neuer Chat – kurz lesen, dann eine Zeile einfügen

## Was die KI wissen soll (Stand)

- **Supabase, Netlify und GitHub sind voll eingerichtet** (kein „erst Projekt anlegen“). Live-Deploy läuft (Build von `main`, Published).
- **Repo:** `pride` auf dem Rechner, u. a. `c:\Users\Beck\pride`. Remote: `allesimgriff/pride-project`.
- **Admin-Account:** `tb@allesimgriff.de`.
- **UI:** Kategorie / Entwicklungsnummer getrennt; **Kategorien & Präfixe** über Modal (`CategoryPrefixesModal`) – siehe `HANDOFF_FUER_NEUEN_CHAT.md` → „Stand dieser Datei“.

## Deine Arbeitsweise (für die KI)

- Du **programmierst nicht** – du **führst nur aus**, was du **kopieren** kannst:
  - **Links** im Browser öffnen,
  - **SQL** im Supabase SQL Editor einfügen und **Run**,
  - **Terminal:** **nummerierte Schritte**, **ein Befehl pro Kasten**, **nur** der Inhalt des Kastens (kein Prompt, keine Fehlermeldung mitkopieren).
- Du willst **Schritt für Schritt**, **kurze** Antworten – **nicht** mit Infos „zugemüllt“ werden.
- **Keys/Secrets** kommen **nie** in den Chat (nur `.env.local` / Dashboards).

## Diese eine Zeile in den neuen Chat kopieren

```text
@HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen und danach arbeiten. Deutsch. Meine Arbeitsweise steht darin und in @NEUER_CHAT_START.md – Schritt für Schritt, ich führe nur Links / SQL / kopierte Terminalbefehle aus.
```

(Optional zusätzlich anhängen: `@LOKAL_STARTEN.md` nur wenn es um lokales Setup geht.)
