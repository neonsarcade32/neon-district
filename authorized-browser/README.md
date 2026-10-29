# Neon District Authorized Browser Service (backend scaffold)

This is a restricted browser-session API, not an open proxy. It is not deployed by committing these files.

## Required runtime environment
- `BROWSER_API_TOKEN`: random secret with at least 32 characters. Store it in the host's secret manager; never commit it or put it in the frontend.
- `ALLOWED_ORIGIN`: exact deployed Neon District origin, e.g. `https://neonsarcade32.github.io`.
- `ALLOWED_HOSTS`: comma-separated exact HTTPS hostnames the browser may visit. Do not use wildcards. Empty/missing values fail startup.
- `PORT`: optional, defaults to 8080.
- `MAX_SESSIONS`: optional, clamped to 1–5.
- `SESSION_TTL_MS`: optional, clamped to 1–30 minutes.

## API
- `GET /healthz` — non-secret service/runtime status.
- `POST /sessions` — create an isolated browser context (Bearer token required).
- `POST /sessions/:id/navigate` JSON `{"url":"https://an-allowlisted-host.example/"}`.
- `GET /sessions/:id/screenshot` — returns the current viewport as PNG.
- `DELETE /sessions/:id` — closes a session.

## Security boundaries
- HTTPS target URLs only; no URL credentials or custom ports.
- Exact hostname allowlist; DNS results are checked to reject private/reserved address ranges.
- Every browser request is rechecked and blocked when not allowed; service workers are disabled.
- Bearer-token auth, exact-origin CORS, bounded session count, automatic idle expiry, isolated contexts, no downloads, no browser profile persistence.
- Do not expose the API publicly until HTTPS termination, secret configuration, rate limiting at the hosting edge, and the deployment's network policy are verified.
- Do not use this as a way to bypass network controls or access sites you are not authorized to use.

## Deployment status
Scaffold only. HTTPS is expected to be provided by a configured hosting platform/reverse proxy. No service URL exists until deployed and smoke-tested. The Neon District static page is not yet wired to these API endpoints. A frontend integration must keep the token out of client-side code; use a server-side authenticated gateway or user-authenticated backend design before exposing sessions to a browser.
