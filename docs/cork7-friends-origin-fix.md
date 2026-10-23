# Cork7 friends incorrectly appear OFFLINE on Neon District

## Verified failure (2026-10-22)

Both users are signed into Cork7 as friends via the self-hosted Neon District page. A non-authenticated connectivity test to the Cork7 friends presence WebSocket at:

`wss://whiteout-mountain.kkgzkbcvbf.workers.dev/parties/friends/hub`

returned:

| Browser Origin | WebSocket Upgrade | First response |
|---|---:|---|
| `https://cork7.com` | 101 Switching Protocols | `auth-required` (expected for no token) |
| `https://neonsarcade32.github.io` | **403 Forbidden** | Upgrade rejected |

This proves the Worker rejects the Neon District web origin **before** the user can authenticate, so client-side friend status is always disconnected. No username, password, token, or friend details were accessed for this test.

## Required authorized backend fix

In the existing Cloudflare Worker **that serves the `/parties/friends/hub` WebSocket endpoint**, extend the approved browser origins to include the exact origin `https://neonsarcade32.github.io`. If the Worker uses an `ALLOWED_ORIGINS` list, add that string to the existing allowlist rather than replacing it.

Use the **origin only**, not a GitHub Pages subpath:
- Allow `https://neonsarcade32.github.io`
- Retain `https://cork7.com` and any existing official origins
- Do not allow `*` or trust arbitrary `Origin` values
- Do not remove account-token checks, friendship permissions, rate limits, server authentication, moderation, or the `auth-required` challenge
- Preserve authenticated `hello`, friend-presence, heartbeat, and challenge/invite behavior
- Restrict any additional HTTP CORS changes to endpoints genuinely required by the self-hosted browser client

**Where to deploy:** the Cloudflare Worker running `whiteout-mountain.kkgzkbcvbf.workers.dev`, not the GitHub Pages site or its `server.js`. The necessary Worker source and deployment authorization are not in the currently connected GitHub repositories, so this cannot be completed solely by pushing Neon District frontend code.

## Verify after Worker deployment

From repo root, run:

```sh
npm install --no-audit --no-fund
node tests/cork7-hub-origin-probe.cjs
```

The GitHub workflow `Cork7 friends presence connectivity diagnosis` can also be triggered manually after Worker deployment. Both origins must receive successful WebSocket upgrades and the unauthenticated `auth-required` message (not a 403). Then verify with two authorized test accounts, signed in on **separate browsers/devices**, with matching accepted friendship, that each appears online and that invitations are delivered.

## Fallback behavior

Do **not** spoof `Origin`, forward player JWTs through third-party proxies, create a false local presence indicator, or change the original game to a link. These approaches can misrepresent authentication or circumvent the server's security boundary.
