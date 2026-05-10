# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM oven/bun:1.1 AS build
WORKDIR /app

# Install deps (cached)
COPY package.json bun.lockb* bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy source and build
COPY . .
# Remove the committed routeTree so the TanStack Router plugin generates it
# once cleanly. Otherwise the parallel client/ssr/worker builds (Cloudflare
# plugin) race on the existing file and spam:
#   "File src/routeTree.gen.ts was modified by another process during processing."
RUN rm -f src/routeTree.gen.ts
RUN bun run build

# ---------- Runtime stage ----------
FROM oven/bun:1.1 AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copy build artifacts + minimal files needed by wrangler
COPY --from=build /app/dist ./dist
COPY --from=build /app/wrangler.jsonc ./wrangler.jsonc
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

# Serve the built Cloudflare Worker via wrangler's local workerd runtime.
# This is what `vite preview` does under the hood for this template.
CMD ["bunx", "wrangler", "dev", "--ip", "0.0.0.0", "--port", "3000", "--log-level", "info"]
