# Neon District Authorized Browser Service

This is a restricted remote browser-session API, not an open proxy. The Docker backend and the static frontend are separate services.

## Deploy with Render

The repository's root `render.yaml` includes a separate `neon-district-authorized-browser` Docker service alongside the existing arcade service. To create it, sign in to Render, choose **New → Blueprint**, and select this repository. Review the plan and any charges before confirming the blueprint. The browser service is not live until you explicitly create/deploy it and Render reports a successful deployment.

Configure these values in the browser service's environment settings:
- `BROWSER_API_TOKEN`: random secret with at least 32 characters. Generate a unique token and store it only in Render's secret/environment settings and the user-entered session of the browser page. Never commit it.
- `ALLOWED_ORIGIN`: `https://neonsarcade32.github.io`
- `ALLOWED_HOSTS`: comma-separated exact HTTPS hostnames that you are authorized to browse. No wildcards. Include only destinations you intend to allow.
- `PORT`: supplied by the host; otherwise defaults to 8080.
- `MAX_SESSIONS`: optional, clamped to 1–5.
- `SESSION_TTL_MS`: optional, clamped to 1–30 minutes.

The service must have HTTPS enabled and a working `/healthz` check. Before exposing it to public traffic, verify hosting network egress restrictions, rate limits, token rotation, and that the deployed instance has enough memory for Chromium. A small/free instance may not have sufficient memory for reliable Chromium sessions.

## API

- `GET /healthz` — non-secret service/runtime status.
- `POST /sessions` — create an isolated browser context (Bearer token required).
- `POST /sessions/:id/navigate` JSON `{"url":"https://an-allowlisted-host.example/"}`.
- `GET /sessions/:id/screenshot` — returns the current viewport as PNG.
- `DELETE /sessions/:id` — closes a session.

## Security boundaries and limitations

- HTTPS target URLs only; no URL credentials or custom ports.
- Exact hostname allowlist and DNS checks against private/reserved address ranges.
- Every browser request is rechecked; service workers and downloads are disabled.
- Bearer-token auth, exact-origin CORS, bounded session count, automatic idle expiry, isolated contexts, and no persistent browser profile.
- The allowlist can block a page's third-party scripts/assets unless those hosts are explicitly approved.
- DNS checks in application code alone do not fully eliminate DNS-rebinding risk; infrastructure-level egress blocking of private/link-local/metadata ranges is required before production use.
- Do not use this service to bypass network controls or access sites you are not authorized to use.

## Frontend

Open `chromium-browser.html` from the deployed GitHub Pages site. Enter the deployed HTTPS backend origin and the token issued by the service operator. The token remains in page memory only; it is not saved to local or session storage. The page provides runtime check, session start/stop, allowlisted navigation, and screenshots.

## Verification status

Repository configuration only. No live backend URL exists until the hosting service is created and deployed. Real navigation, screenshot, disconnection, and physical iPad behavior still require live end-to-end testing.
