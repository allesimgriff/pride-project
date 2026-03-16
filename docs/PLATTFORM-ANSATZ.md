# Plattform-Ansatz: PRIDE – Produktentwicklung Polstermöbel

Diese Datei beschreibt den fachlichen und technischen Ansatz der Plattform.

---

## Ziel der Plattform

Eine webbasierte Plattform, auf der mehrere Mitarbeiter gemeinsam an **Produktentwicklungen für Polstermöbel** arbeiten können — strukturiert nach Entwicklungsnummern, mit Dateien, Kommentaren, Status, Varianten und Freigaben.

---

## Was die Plattform können sollte

### 1. Projektübersicht

Jede Entwicklung bekommt einen eigenen Datensatz mit:

* Entwicklungsnummer
* Produktname
* Kategorie
  * Sessel Möbelhandel
  * Pflegesessel Sanitätshaus
  * Sofas Möbelhandel
  * optional später: MotoSleep
* Kunde / Markt / Land
* verantwortliche Person
* Status
  * Idee
  * in Entwicklung
  * Muster in Arbeit
  * Freigabe intern
  * Freigabe extern
  * abgeschlossen

### 2. Detailseite je Entwicklung

Pro Entwicklung sollten folgende Bereiche vorhanden sein:

* Beschreibung des Produkts
* Maße und technische Daten
* Funktionen
* Materialien / Bezüge / Schäume / Gestelle
* Mechaniken / motorische Optionen
* Zielpreis / Kalkulationsrahmen
* Besonderheiten / Probleme / offene Punkte
* Bilder, Skizzen, Renderings, PDFs
* Versionshistorie

### 3. Zusammenarbeit im Team

Mehrere Mitarbeiter sollen:

* Kommentare hinterlassen können
* Dateien hochladen können
* Änderungen nachvollziehen können
* Aufgaben zuweisen können
* Status ändern können
* interne Notizen pflegen können

### 4. Dokumentenmanagement

Wichtig für Produktentwicklung:

* PDF-Uploads
* Bilder
* technische Zeichnungen
* Excel/Preislisten
* Freigabe-Dokumente
* Versionierung der Dateien

### 5. Aufgaben und To-dos

Zu jeder Entwicklung:

* Aufgaben an Mitarbeiter
* Priorität
* Fälligkeit
* Bearbeitungsstatus
* Verantwortlicher

### 6. Rollen und Rechte

Zum Beispiel:

* Admin
* Projektleitung
* Entwicklung
* Einkauf
* Vertrieb
* externer Partner / Fabrik

Damit nicht jeder alles bearbeiten kann.

---

## Besonderheit: Ein Projektleiter

Da die Software nur mit dem eigenen Team genutzt wird, wird **bewusst darauf verzichtet**, dass es einen anderen Projektleiter gibt. **Ich bin immer der Projektleiter und Verantwortliche.** Die Plattform muss keinen separaten „Projektleiter“-Zuweisungsfluss abbilden; die Rolle dient der Rechteverwaltung, nicht der Zuweisung eines anderen Projektleiters pro Projekt.

---

## Sinnvolle erste Version (MVP)

Für den Start würde ich **nicht zu groß** bauen.

### MVP-Funktionen:

* Login
* Benutzerverwaltung
* Projektliste
* Detailseite pro Entwicklung
* Datei-Upload
* Kommentare
* Statusverwaltung
* Aufgabenliste
* einfache Rollen

Das reicht schon, um echten Nutzen zu schaffen.

---

## Technischer Vorschlag für Cursor

Da du mit Cursor arbeiten willst, würde ich das so aufsetzen:

### Stack

* **Frontend:** Next.js
* **Backend / Datenbank / Auth / Storage:** Supabase
* **UI:** Tailwind CSS
* **Hosting:** Vercel oder europäischer Hoster
* **Dateien:** Supabase Storage

### Warum das sinnvoll ist

* schnell startbar
* sauber für interne Plattformen
* Login, Datenbank und Dateiablage direkt integriert
* gut mit Cursor umsetzbar
* später erweiterbar

---

## Datenstruktur grob

### Tabellen

* `users`
* `projects`
* `project_comments`
* `project_files`
* `project_tasks`
* `project_updates`
* `project_categories`
* `project_statuses`

Optional später:

* `suppliers`
* `materials`
* `prototypes`
* `approvals`

---

## Oberfläche

### Seiten

1. **Login**
2. **Dashboard**
   * offene Projekte
   * letzte Änderungen
   * fällige Aufgaben
3. **Projektliste**
   * Filter nach Status, Kategorie, Verantwortlichem
4. **Projekt-Detailseite**
   * Stammdaten
   * Dateien
   * Kommentare
   * Aufgaben
   * Historie
5. **Benutzerverwaltung**
6. **Einstellungen**

---

## Was der Nutzen ist

Die Plattform löst typische Probleme:

* Informationen liegen nicht mehr in E-Mails, WhatsApp oder verstreuten Ordnern
* jeder sieht den aktuellen Stand
* Entwicklungsstände werden dokumentiert
* Kommunikation mit Mitarbeitern und Partnern wird nachvollziehbar
* Projekte werden sauber nach Entwicklungsnummern geführt

---

## Starke Kurzbeschreibung

**Eine webbasierte Entwicklungsplattform für Polstermöbel, mit der mehrere Mitarbeiter gemeinsam Produktentwicklungen strukturiert verwalten, dokumentieren und vorantreiben können — inklusive Entwicklungsnummern, Dateien, Kommentaren, Aufgaben, Status und Freigaben.**

---

## Prompt für Cursor

Den kannst du direkt verwenden:

```text
Erstelle eine moderne webbasierte interne Plattform für die Produktentwicklung von Polstermöbeln.

Ziel:
Mehrere Mitarbeiter sollen gemeinsam an Produktentwicklungen arbeiten können. Die Plattform soll Entwicklungsprojekte strukturiert verwalten, dokumentieren und für die Zusammenarbeit nutzbar machen.

Tech-Stack:
- Next.js
- Tailwind CSS
- Supabase für Auth, Datenbank und Storage

Die Anwendung soll folgende Funktionen enthalten:

1. Login-System
- Benutzer können sich anmelden
- Rollen: Admin, Projektleitung, Entwicklung, Einkauf, Vertrieb, externer Partner

2. Dashboard
- Übersicht über laufende Entwicklungen
- letzte Änderungen
- offene Aufgaben
- Projekte nach Status gruppiert

3. Projektverwaltung
Jede Entwicklung soll folgende Felder haben:
- Entwicklungsnummer
- Produktname
- Kategorie
- Kunde / Markt / Land
- verantwortliche Person
- Status
- Beschreibung
- technische Daten
- Funktionen
- Materialien
- Zielpreis
- offene Punkte

4. Projekt-Detailseite
- Stammdaten des Projekts
- Datei-Upload für PDFs, Bilder und Dokumente
- Kommentarbereich für Teamkommunikation
- Aufgabenbereich mit Verantwortlichem, Priorität und Fälligkeit
- Historie der Änderungen

5. Projektliste
- Suchfunktion
- Filter nach Status, Kategorie und Verantwortlichem

6. Design
- modern
- klar
- professionell
- eher B2B / Industrie / Produktentwicklung
- ruhige Farben
- übersichtliche Karten und Tabellen
- Fokus auf gute Nutzbarkeit im Arbeitsalltag
- Desktop-first

7. Datenstruktur in Supabase
Erstelle sinnvolle Tabellen für:
- users
- projects
- project_comments
- project_files
- project_tasks
- project_updates

8. Ausgabe
- vollständige Projektstruktur
- alle benötigten Dateien
- saubere Komponentenstruktur
- direkt lauffähiger Startpunkt
```
