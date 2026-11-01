# Architecture rules
- Application lists, edits and preview lookups must use the same direct Postgres connection as submissions, never a Data API fallback, to avoid split records.
- Read-only diagnostics use `withHubRead` without schema bootstrap; inspection must not change the database.