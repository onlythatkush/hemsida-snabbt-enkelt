# Architecture rules
- Application lists, edits and preview lookups must use the same direct Postgres connection as submissions, never a Data API fallback, to avoid split records.
- Read-only diagnostics use `withHubRead` without schema bootstrap; inspection must not change the database.
- Use the Lovable TanStack Vite wrapper for the default deployment so the existing domain receives a bundled Worker and dist output, not a Node-only Nitro artifact.
- Public order and confirmation requests default to same-origin; an alternate backend requires an explicit deployment override to prevent silent routing to stale hosting.