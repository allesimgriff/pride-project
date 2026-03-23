# Übergabeprotokoll → neuer Chat (PRIDE)

**Stand:** 2026-03-21  
**Zweck:** Der neue Chat soll **nicht bei null** anfangen. Dieses Protokoll + **`HANDOFF_FUER_NEUEN_CHAT.md`** sind die maßgeblichen Quellen.

---

## 1. Pflichtlektüre für die KI (Reihenfolge)

1. **`.cursor/rules/pride-arbeitspartner.mdc`** – Kommunikation, Terminal, keine Keys im Chat, Deploy nur mit Freigabe.  
2. **`HANDOFF_FUER_NEUEN_CHAT.md`** – vollständig: *Arbeitsmodus (Thomas)*, *Wo wir gerade sind*, *Aktuelles Problem*.  
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

## 3. Was in dieser Session technisch angelegt/geändert wurde (Referenz)

- **Einladungen / Registrierung:** RLS-Anonymus-Problem behoben per RPC `get_invite_for_registration` (Migrationen `025`/`026`), nach Signup `mark_invite_accepted` (`027`) – SQL im Supabase-Projekt **pride** ausführen, wenn noch nicht geschehen.  
- **Mail / Env:** u. a. SMTP-Absender-Logik; **Netlify:** Supabase-Extension, `NEXT_PUBLIC_*`-Abgleich; **`public-env.ts`:** Fallback für Extension-URL-Variablen.  
- **Auth:** `auth/callback` erweitert (u. a. `token_hash`, sicheres `next`); Login zeigt Fehler bei `?error=auth`.  
- **Doku:** `HANDOFF_FUER_NEUEN_CHAT.md`, `NEUER_CHAT_START.md` fortgeschrieben.

*(Details und Pfade: siehe `HANDOFF_FUER_NEUEN_CHAT.md`.)*

---

## 4. Offenes Problem (Priorität)

**Beobachtung:** Einladung **über PRIDE**; Empfänger **landet bei Handwerker** (Oberfläche / falsche Site-Erwartung), obwohl für **pride-project** in Netlify u. a. **`NEXT_PUBLIC_APP_EDITION=pride`** gesetzt ist.

**Nächster Schritt im neuen Chat:** Ursache eingrenzen (Link in der Mail vs. Build-Zeit `NEXT_PUBLIC_*` vs. Env), **ohne** lange Vorlesung; ggf. gezielter Code (z. B. Basis-URL nur für Einladungsmails) nur mit Thomas’ Freigabe.

---

## 5. Eine Zeile für den neuen Chat (kopieren)

```text
@UEBERGABEPROTOKOLL_NEUER_CHAT.md und @HANDOFF_FUER_NEUEN_CHAT.md vollständig lesen – zuerst Arbeitsmodus (Thomas), Wo wir stehen, Aktuelles Problem. Deutsch. Pro Antwort nur EIN Schritt für mich. Kurz, nur Kopierbares.
```

---

*Ende Protokoll. Ergänzungen nur im HANDOFF pflegen oder hier Datum/„Stand“ anheben.*
