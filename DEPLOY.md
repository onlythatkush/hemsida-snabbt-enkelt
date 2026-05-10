# Deploying to Coolify

`bun run build` succeeds — verified locally. If your Coolify build fails at
`vite build` / `transforming...`, the cause is almost always the **build
environment**, not the code. Fix one of these:

## 1. Use the Dockerfile build pack (recommended)

This template is a TanStack Start app that compiles to a Cloudflare Worker
(workerd) — it is **not** a plain static site. The included `Dockerfile`
already builds and serves it correctly.

In Coolify:
- **Build Pack:** `Dockerfile`
- **Dockerfile location:** `./Dockerfile`
- **Port:** `3000`

That's it — no `start` command needed.

## 2. If you must use Nixpacks

Nixpacks doesn't natively know how to serve a Cloudflare Worker. Use:

- **Build command:** `bun run build`
- **Start command:** `bun run start`
  (runs `bunx wrangler dev --ip 0.0.0.0 --port $PORT`)

You may need to add `bun` and `wrangler` to the Nixpacks providers, or set
`NIXPACKS_PKGS=bun`. The Dockerfile route avoids all of this.

## Required environment variables (build time)

Vite inlines these at **build** time, so they must be set in Coolify before
the build runs (they are also committed in `.env` for local dev):

```
VITE_SUPABASE_URL=https://zpjtdkkltogntqdzufct.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from .env>
VITE_SUPABASE_PROJECT_ID=zpjtdkkltogntqdzufct
```

If these are missing during build, the Supabase client throws at runtime on
the first page render and the deployment looks broken.

## Branch

Default branch is `main`. If your GitHub repo uses `master`, rename it on
GitHub (Settings → Branches) or change the branch field in Coolify.

## Local sanity check

```bash
bun install
bun run build      # must succeed
docker build -t app . && docker run --rm -p 3000:3000 app
# open http://localhost:3000
```
