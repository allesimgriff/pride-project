# PRIDE – Produktentwicklung Polstermöbel

Interne webbasierte Plattform für die gemeinsame Produktentwicklung von Polstermöbeln.

## Tech-Stack

- **Next.js 15** (App Router)
- **Tailwind CSS**
- **Supabase** (Auth, PostgreSQL, Storage)

## Funktionen

- **Login** mit E-Mail/Passwort, Rollen: Admin, Projektleitung, Entwicklung, Einkauf, Vertrieb, externer Partner
- **Dashboard**: Übersicht laufender Entwicklungen, letzte Änderungen, offene Aufgaben, Projekte nach Status
- **Projektverwaltung**: Entwicklungsnummer, Produktname, Kategorie, Kunde/Markt/Land, Verantwortliche:r, Status, Beschreibung, technische Daten, Funktionen, Materialien, Zielpreis, offene Punkte
- **Projekt-Detail**: Stammdaten bearbeiten, Datei-Upload (PDF, Bilder, Dokumente), Kommentare, Aufgaben (Verantwortlicher, Priorität, Fälligkeit), Historie
- **Projektliste**: Suche, Filter nach Status, Kategorie, Verantwortlichem

## Einrichtung

**Wenn du nicht programmierst:** bitte nur der Datei **`LOKAL_STARTEN.md`** folgen (Schritt für Schritt, Befehle zum Kopieren).

---

### 1. Abhängigkeiten

```bash
npm install
```

### 2. Supabase

1. Projekt unter [supabase.com](https://supabase.com) anlegen.
2. Unter **Project Settings → API** die Werte kopieren:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Datei `.env.local` anlegen (siehe `.env.example`).
4. Im **SQL Editor** das Skript aus `supabase/migrations/001_initial_schema.sql` ausführen (komplett).

### 3. Storage-Bucket (für Datei-Uploads)

Im Supabase-Dashboard:

1. **Storage** → **New bucket**
2. Name: `project-files`
3. **Public bucket**: aus (privat)
4. Erstellen.

Policies für den Bucket `project-files`:

- **SELECT**: Authenticated users können lesen.
- **INSERT**: Authenticated users können hochladen.
- **DELETE**: Authenticated users können löschen (oder nach Bedarf einschränken).

Oder per SQL (falls Ihr Supabase-Standard-Setup das unterstützt):

```sql
-- Bucket anlegen (falls noch nicht vorhanden)
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policies (Schema storage)
CREATE POLICY "Authenticated read project-files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated upload project-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Authenticated delete project-files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-files');
```

### 4. Benutzer anlegen

- **Authentication** → **Users** → **Add user** (E-Mail + Passwort).
- Optional: In der Tabelle `public.profiles` die Spalte `role` anpassen (z. B. `admin`, `projektleitung`, `entwicklung`, …). Beim ersten Login wird ein Profil automatisch aus `auth.users` erstellt; die Rolle kann in `profiles` nachgepflegt werden.

### 5. Entwicklungsserver starten

```bash
npm run dev
```

App: [http://localhost:3000](http://localhost:3000). Ohne Login werden Sie zur Anmeldeseite weitergeleitet.

## Skripte

- `npm run dev` – Entwicklungsserver
- `npm run build` – Produktionsbuild
- `npm run start` – Server nach Build starten
- `npm run lint` – Linting

## Projektstruktur (auszugsweise)

```
src/
  app/
    (auth)/login/        # Login-Seite
    (dashboard)/         # Geschützte Bereiche
      dashboard/         # Dashboard
      projects/          # Liste, Neu, Detail [id]
    api/
      auth/signout/      # Abmeldung
      files/[id]/download/ # Datei-Download
    actions/projects.ts  # Server Actions (CRUD, Kommentare, Aufgaben)
  components/
    layout/              # Sidebar, Header
    projects/            # Projekt-Komponenten
  lib/supabase/          # Supabase Client (Browser/Server/Middleware)
  types/database.ts      # Typen & Konstanten
supabase/migrations/     # SQL-Schema
```

## Datenmodell (Supabase)

- **profiles** – erweitert auth.users (Rolle, Name)
- **projects** – Entwicklungsprojekte mit allen Stammdaten
- **project_comments** – Kommentare pro Projekt
- **project_files** – Metadaten zu hochgeladenen Dateien (Dateien in Storage)
- **project_tasks** – Aufgaben mit Verantwortlichem, Priorität, Fälligkeit
- **project_updates** – Änderungshistorie

RLS (Row Level Security) ist aktiviert; authentifizierte Nutzer haben Lese-/Schreibzugriff gemäß den Policies in der Migration.
