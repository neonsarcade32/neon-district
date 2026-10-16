# Neon Browser — public, independent sessions

## What was added

The initial **Neon Browser Lab** is a working, static web launcher in `neon-browser.html` linked from the Neon District homepage. Each visitor uses their own browser, and links open official websites in separate tabs. The page intentionally does **not** claim to stream Chromium, proxy websites, or keep searches private from network administrators.

The existing privately forwarded Chromium at Codespaces port 3100 is **not** connected or published.

## What a real in-site browser for every visitor requires

GitHub Pages only hosts static files. A true streamed Chromium experience (videos, real web apps, independent browsing *inside* the arcade) needs a separate continuously running service and budget.

### Deployment architecture (not yet implemented)

1. User signs in to the service, or receives a short-lived, strictly limited guest identity.
2. Session broker grants a fresh, unguessable session token that is bound to that identity and expires quickly.
3. An isolated, disposable browser container/VM is provisioned **per active visitor**, with a fresh profile, non-root permissions, no Docker socket, no sensitive mounts and no privileged mode.
4. Reverse proxy authenticates every HTTP/WebSocket upgrade before forwarding to a session-specific stream endpoint over HTTPS/WSS.
5. Private networking and cloud metadata addresses are blocked from browser egress. Put strict limits on CPU/RAM, parallel sessions, session duration and outbound requests.
6. Idle browsers shut down automatically and lose their profiles. Provide explicit reset/logout and administrative kill-switch.
7. Test Safari/iPad touch gestures, audio, video, reconnects, and performance. Cloud browsing will be slower and some websites can restrict data-center clients.

**Never** point an unauthenticated public Neon District page at the current Codespaces port 3100. Do not expose arbitrary proxying or shared remote desktop access to the public. The multiplayer Render service should stay separate.

## Launch checks

- Browser Lab page works in GitHub Pages without extra dependencies.
- HTTP(S) URLs and search terms launch appropriate websites; unsupported URI schemes are rejected.
- The current page does not store searches, tokens, history or cookies.
- Existing arcade game list, favorites, leaderboards, multiplayer and saves are unchanged.
- Future cloud feature remains explicitly marked **not deployed** until backend isolation, abuse prevention, security review and costs are addressed.

## Free-first direction selected (October 2026)

The site will remain **$0 to host** on GitHub Pages. The live public feature is the independent website launcher. For users who want real remote Chromium, `browser-lab/start.sh` provides an optional Codespaces setup with each person's **own** GitHub account and quota, on private port 3200.

**Do not confuse this with a true public, one-click streamed browser:** that is not deployable at unlimited scale free of charge, and this project will not publish the owner's existing port 3100 or silently run a public proxy. No recurring cost, paid account, or payment card is required for the static launcher. For personal Codespaces, free quota and account eligibility apply; do not opt into billable overages.

Cloudflare Browser Run's Workers Free plan supplies only 10 browser-minutes per day (shared across visitors) and up to 3 concurrent sessions; the browser timeout is 60 seconds. This is not sufficient for long interactive TikTok sessions. Render's free web instance is limited to 512 MB RAM and 0.1 CPU, and sleeps when idle. Neither is an unlimited cloud desktop host.
