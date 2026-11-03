# Architecture rules
- Every order-hub read/write goes through `hubSql()`/`withHub*` (store chosen once by `hubStore()`: `HUB_STORE` override, else explicit external Postgres URL, else Lovable Cloud via the service-role-only `hub_exec` RPC); never call `postgres()` or the Data API for hub tables directly, to avoid split records.
- Read-only diagnostics use `withHubRead` without schema bootstrap; inspection must not change the database.
- Use the Lovable TanStack Vite wrapper for the default deployment so the existing domain receives a bundled Worker and dist output, not a Node-only Nitro artifact.
- Public order and confirmation requests default to same-origin; an alternate backend requires an explicit deployment override to prevent silent routing to stale hosting.