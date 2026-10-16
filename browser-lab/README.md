# Start your own Neon Browser — free-quota setup

**One browser per person. No shared sessions. No extra iPad app.**

Neon District supplies this guide and a small starter script. **GitHub runs the browser in your own Codespace on your own GitHub account.** Visitors don't connect to the Neon District creator's browser, so the creator isn't paying to stream everyone else's web pages.

> **Free allowance, not unlimited hosting:** Eligibility, compute hours and storage depend on your GitHub plan. GitHub Free personal accounts include a monthly Codespaces allowance; check who GitHub says will pay before creating a Codespace. If GitHub asks for a payment method or billable overages, stop if you want to stay on the free allowance. This setup is optional.

## Easy iPad instructions

1. **Sign in to your own GitHub account.** Open https://github.com/ in Safari. You can sign up there if you're eligible and don't already have an account.
2. **Open Neon District's repository:** https://github.com/neonsarcade32/neon-district. Tap **Code → Codespaces → Create codespace on main**. Wait for the VS Code browser editor to load. You **do not** need to fork the repository or edit code.
3. **Open Terminal** in the bottom panel and paste this single command:

   ```bash
   bash browser-lab/start.sh
   ```

   The first run downloads Chromium, a large Docker image. Wait until the terminal reports that the browser started.
4. **Go to Ports**, find **3200**, and confirm it is marked **Private**. If it isn't listed, choose **Forward a Port** and enter **3200**, then set it to Private. Tap the globe/open-in-browser button. Your personal Chromium session should open in Safari.
5. **When finished**, return to Terminal and run:

   ```bash
   docker stop nd-personal-browser
   ```

   Then open https://github.com/codespaces and **Stop** your Codespace too. Closing a Safari tab is *not* the same as stopping the cloud computer.

## What you get

- The real Chromium web browser running inside your personal Codespace; the starter attempts to open TikTok by default.
- A separate session with your own browser history (inside the container) and controls.
- No separate iPad app download; your iPad uses Safari to display the remote browser.
- No need to share the creator's GitHub login or remote desktop.

This is **not** a public browser embedded inside Neon District. It opens a **private GitHub Codespaces link**. Some websites may restrict cloud-based browsers; video, sound, and touch depend on the site, Codespaces performance and Safari.

## Security and privacy

**Never set browser port 3200 to Public** or share your forwarded URL. It exposes a powerful remote desktop; others could access activity or signed-in accounts. The starter binds the service to localhost inside the Codespace, and GitHub's private port is meant to require your account access. Stay signed in to your own GitHub account and don't publish passwords or browser cookies.

This is not a way to hide internet activity. GitHub hosts the Codespace and websites may record actions; managed devices and networks can have additional monitoring. Follow the rules that apply to your device and network.

## Troubleshooting

- **Docker unavailable:** If Terminal says Docker is not ready, check that the Codespace completed startup. Not all Codespaces environments or plans support the same resources.
- **White or black screen:** Reload the private port link, wait for Chromium startup, and try `docker logs --tail 30 nd-personal-browser` in Codespaces to view its errors.
- **Port 3200 doesn't appear:** Forward port 3200 manually in the Ports panel. Confirm the container exists with `docker ps -a --filter name=nd-personal-browser`.
- **“Container stopped” message:** The startup script does not delete your old session. Run `docker start nd-personal-browser` to try restarting it.
- **Sound missing:** Check the remote stream's audio controls, unmute the page, and interact with the page once. Sound is not guaranteed.
- **Codespaces free usage finished:** Stop the Codespace and wait for the next allowance period, or use the regular Neon Browser launcher that opens sites in Safari. Don't enable paid usage to fix this if you want the free setup.

## Ownership and cost

GitHub Codespaces is provided by GitHub, **not by Neon District**. Every visitor starts their **own** GitHub Codespace and uses their own eligible account's compute and storage quota. This helps keep Neon District's hosting inexpensive, but it also means no centrally hosted one-click browser is promised.

GitHub's official docs: https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository and https://docs.github.com/en/billing/reference/product-usage-included.
