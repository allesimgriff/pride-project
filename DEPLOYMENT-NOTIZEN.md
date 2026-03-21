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

## Netlify

- Site-Name: z. B. pride-project / handwerker-allesimgriff (wie im Dashboard)
- URL: `https://<DEINE-NETLIFY-URL>.netlify.app`

## Supabase

- Werte nur im **Supabase-Projekt** unter **Project Settings → API Keys** kopieren (nicht hier).

## Nützliche Befehle

- Dev-Server: `npm run dev`
- Build testen: `npm run build`
