# Neuer Chat – kurz lesen, dann eine Zeile einfügen

**Übergabeprotokoll (kompakt):** `UEBERGABEPROTOKOLL_NEUER_CHAT.md` – zusammen mit `HANDOFF_FUER_NEUEN_CHAT.md` für den Einstieg.

**Nach Deploy / nächste Schritte (nummeriert):** `WEITER_NACH_DEPLOY.md` – **zuerst Netlify prüfen**, dann **Supabase SQL nur bei Bedarf**, dann testen (u. a. **`/projects`** als Mitglied).

## Was die KI wissen soll (Stand)

- **Zuerst** `HANDOFF_FUER_NEUEN_CHAT.md` voll lesen: **„Arbeitsmodus (Thomas)“**, **„Wo wir gerade sind“**, **„Bereits erledigt“** – **nicht raten**, Erledigtes nicht erneut erfragen.
- **Regeln / Arbeitsweise:** `.cursor/rules/pride-arbeitspartner.mdc` und im HANDOFF Abschnitt **„Arbeitsmodus (Thomas)“** (kurz, kein Geschwätz, Schritte kopierbar, Deploy nur mit Freigabe).
- **Supabase, Netlify, GitHub** sind eingerichtet. **Ein User / Admin:** `tb@allesimgriff.de`.
- **Zwei Netlify-Sites** (PRIDE + Handwerker), **eine** gemeinsame Supabase-DB (Projekt **pride**); aktueller Stand und erledigte Punkte im HANDOFF.
- **Repo:** `c:\Users\Beck\pride`, Remote `allesimgriff/pride-project`. Branch **`company`** = Commit **`4d44967`** (Firmen-Stand); **`main`** = neuere Entwicklung.
- **Details:** `HANDOFF_FUER_NEUEN_CHAT.md` voll lesen.

## Arbeitsweise

- Alles Verbindliche steht in **`HANDOFF_FUER_NEUEN_CHAT.md`** → **„Arbeitsmodus (Thomas)“** und in **`.cursor/rules/pride-arbeitspartner.mdc`**. Hier **nicht** wiederholen.

## Diese eine Zeile in den neuen Chat kopieren

```text
@HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen – zuerst „Arbeitsmodus (Thomas)“, dann „Bereits erledigt“. Deutsch. Kurz, nur Kopierbares.
```

(Optional zusätzlich anhängen: `@LOKAL_STARTEN.md` nur wenn es um lokales Setup geht.)
