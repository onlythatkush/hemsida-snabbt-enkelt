# Deploying to Coolify from GitHub

> Default branch is `main`. If your GitHub repo uses `master`, either rename it
> to `main` on GitHub (Settings → Branches) or change the branch in Coolify.

This app is a TanStack Start project that builds for the Cloudflare Workers
runtime (workerd). The included `Dockerfile` builds the app and serves the
built Worker via `wrangler` so it runs anywhere Docker runs — including Coolify.

## 1. Push to GitHub

In Lovable: **+ menu → GitHub → Connect project → Create Repository**.
Every change in Lovable now auto-pushes to that repo.

## 2. Create the app in Coolify

1. **Projects → + New → Application**
2. Source: **Public Repository** (or **Private** + GitHub App if private)
3. Paste the repo URL, branch `main`
4. Build Pack: **Dockerfile**
5. Dockerfile location: `./Dockerfile`
6. Port: **3000**

## 3. Environment variables

Add anything your app needs in **Environment Variables**, e.g.:

```
NODE_ENV=production
# VITE_PUBLIC_* values needed at build time go here too
```

Any `VITE_*` variable must be set **before build** (Coolify injects build-time
env vars automatically when defined in the app settings).

## 4. Domain & HTTPS

Set your domain under **Domains** in the Coolify app settings. Coolify will
issue a Let's Encrypt cert automatically.

## 5. Deploy

Click **Deploy**. Coolify will:
1. Clone the repo
2. Run the Dockerfile (`bun install` → `bun run build`)
3. Start the container with `wrangler dev` bound to `0.0.0.0:3000`
4. Route your domain to it

## 6. Auto-deploy on push

Enable **Auto Deploy** in the Coolify app → every push to `main` (from
Lovable or local) triggers a redeploy.

## Local sanity-check

```bash
docker build -t my-app .
docker run --rm -p 3000:3000 my-app
# open http://localhost:3000
```

## Notes

- The runtime uses Cloudflare's `workerd` via `wrangler dev`. This is the same
  engine used in production on Cloudflare and is fully supported for
  self-hosting.
- `wrangler.jsonc` must remain in the repo — it tells `wrangler` where the
  built worker entry is (`dist/...`).
- If you later move to Cloudflare directly, you can swap the deploy step for
  `bunx wrangler deploy` and skip Docker entirely.
