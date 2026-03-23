# Deployment-Notizen

## Repositories

- GitHub-Repo: https://github.com/allesimgriff/pride-project

## Netlify (gleiche Variablennamen für jede Site – PRIDE vs. Handwerker)

| Variable in Netlify | Woher der Wert (Supabase-Dashboard) |
|---------------------|-------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → API Keys** → **Project URL** (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **API Keys** → **Legacy** Tab → **anon** „public“ (JWT), **oder** Tab **Publishable** → Key `sb_publishable_…` (Code akzeptiert beides) |
| `NEXT_PUBLIC_APP_URL` | **Nicht** aus Supabase: die **öffentliche URL dieser Netlify-Site** (`https://….netlify.app`) |

**Wichtig:** Pro **Netlify-Site** die Werte aus dem **passenden** Supabase-Projekt (PRIDE vs. Handwerker). URL und Key **immer im Paar** aus **demselben** Projekt.

**Nie** echte Keys in diese Datei schreiben – nur Platzhalter. Keys nur in Netlify / `.env.local`.

### Netlify: bereits gesetzte Variablen (Stand: Betreiber-Bestätigung)

Die folgenden Namen sind im Netlify-Dashboard **für die Site** bereits angelegt (Werte nicht hier dokumentiert):

- `NEXT_PUBLIC_APP_EDITION`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_DATABASE_URL` (teilweise durch Supabase-Integration angelegt)
- `NEXT_PUBLIC_SUPABASE_URL`
- `SMTP_FROM`, `SMTP_HOST`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_USER`
- `SUPABASE_ANON_KEY`, `SUPABASE_DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (teilweise durch Supabase-Integration angelegt)

**Hinweis:** `NEXT_PUBLIC_APP_URL` (öffentliche URL der jeweiligen Netlify-Site) erscheint in dieser Liste nicht – falls Links/Einladungen falsch zeigen, explizit setzen und neu deployen.

## Netlify

- Site-Name: z. B. pride-project / handwerker-allesimgriff (wie im Dashboard)
- URL: `https://<DEINE-NETLIFY-URL>.netlify.app`

## Supabase

- Werte nur im **Supabase-Projekt** unter **Project Settings → API Keys** kopieren (nicht hier).

## Nützliche Befehle

- Dev-Server: `npm run dev`
- Build testen: `npm run build`
