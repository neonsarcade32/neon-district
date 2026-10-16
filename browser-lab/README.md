# Free personal remote Chromium (optional)

This is for GitHub users who want **their own** remote browser, not a shared browser for every anonymous Neon District visitor. It is a separate, optional setup; the public Neon Browser Lab is a normal web launcher.

## Requirements
- Your own GitHub account with access to GitHub Codespaces and remaining free hours.
- No app installation on your iPad; Safari can open GitHub Codespaces.
- Chromium downloads a large Docker image and uses part of your free Codespaces compute quota.

## Setup
1. Visit https://github.com/neonsarcade32/neon-district and open your **own** Codespace using the Code → Codespaces menu.
2. In its terminal run `bash browser-lab/start.sh`.
3. In Codespaces **Ports**, open port `3200` and verify it is set to **Private**.
4. Visit the forwarded link while logged in to your own GitHub account. Chromium attempts to open the real TikTok site by default. Websites may restrict cloud browsing, and sound/video depend on your device and network.
5. Stop the container when finished with `docker stop nd-personal-browser`, and stop your Codespace so you do not waste your allotted hours.

## Security / privacy

Never change this port to Public; it exposes a remote desktop with broad capabilities. Anyone granted access to the same session may see browsing activity or logins. This script binds the port to localhost within the Codespace and never publishes it from GitHub Pages. No username/password is configured within the container because the Codespaces Private port requires the owner's GitHub login. If you share a device, sign out of websites and keep the port private.

## Limits
GitHub Codespaces has a limited monthly free quota for personal accounts and will stop once the quota runs out unless billing is enabled. It stops when the Codespace is stopped. This is not an always-on public browser service and does not give everyone a cloud browser automatically.

If port 3200 is occupied, inspect the existing listener instead of exposing another port publicly.
