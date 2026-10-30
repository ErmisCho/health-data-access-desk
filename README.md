# EHDS Access Desk — front end

## How front-end and backend connect
This React/TypeScript (Vite) app, built with Lovable, is the UI for the EHDS Access Desk. All decisions come from the backend: Supabase Edge Functions (Deno) in [ErmisCho/clinical_hachathlon](https://github.com/ErmisCho/clinical_hachathlon) (see its [README](https://github.com/ErmisCho/clinical_hachathlon#readme)). Live app: https://health-data-access-compass.lovable.app

The app calls the functions with `supabase.functions.invoke` (`src/lib/ehds.ts`):
- `requests`: submit a request, list past requests (GET), fetch one (`?id=`), plus `requests/preview`, `requests/review`, `requests/hdab`
- `spe-download`: body `{ id }`; returns the 403 "download blocked" JSON shown in the staff view
- `register`: GET, the public anonymised register

Env vars (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (the publishable key is client-safe). Server-side code also reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Never commit `SUPABASE_SERVICE_ROLE_KEY`.

Run locally:
```
git clone https://github.com/ErmisCho/health-data-access-desk
cd health-data-access-desk
npm i        # or: bun install
npm run dev
npm test     # vitest
```

The source of truth is [ErmisCho/clinical_hachathlon](https://github.com/ErmisCho/clinical_hachathlon),
folder `web/`. The repository `ErmisCho/health-data-access-desk` is only the deployment
mirror that Lovable builds the live site from; do not open pull requests there.

Live: https://health-data-access-compass.lovable.app

## Development

```sh
bun install
bun run dev
bun run test
bun run build
```

## Publishing

Merge into `clinical_hachathlon`, then push the `web/` subtree to the mirror and publish
in Lovable (Publish → Publish changes):

```sh
git subtree push --prefix=web https://github.com/ErmisCho/health-data-access-desk.git main
```

Lovable also commits edits made in its editor straight to the mirror; pull those back with
`git subtree pull --prefix=web https://github.com/ErmisCho/health-data-access-desk.git main`.
