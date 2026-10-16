#!/usr/bin/env bash
# Personal Chromium instance for your own GitHub Codespace.
# Never expose its forwarded port publicly.
set -euo pipefail

NAME="nd-personal-browser"
PORT="3200"
IMAGE="lscr.io/linuxserver/chromium:latest"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Docker is not available in this Codespace."
  exit 1
fi
if docker ps --format '{{.Names}}' | grep -Fxq "$NAME"; then
  echo "Your browser is already running. Open private Codespaces port $PORT."
  exit 0
fi
if docker ps -a --format '{{.Names}}' | grep -Fxq "$NAME"; then
  echo "Your previous browser is stopped. To preserve its data, start it with:"
  echo "docker start $NAME"
  echo "Then open port $PORT (Private)."
  exit 0
fi

echo "Downloading the Chromium image if necessary (this can take a few minutes)..."
docker pull "$IMAGE"
echo "Starting a personal remote browser. Keep the Codespaces port PRIVATE."
docker run -d \
  --name "$NAME" \
  --shm-size=1g \
  -p "127.0.0.1:${PORT}:3000" \
  -e CHROME_CLI=https://www.tiktok.com \
  -e SELKIES_FRAMERATE=24 \
  -e SELKIES_MANUAL_WIDTH=1280 \
  -e SELKIES_MANUAL_HEIGHT=720 \
  "$IMAGE"
echo
echo "Browser started. In Codespaces choose PORTS → $PORT → Private → Open in Browser."
echo "This browser is YOURS only. Do not make port $PORT public or share the link."
echo "To stop it: docker stop $NAME"
