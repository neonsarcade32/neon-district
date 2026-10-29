#!/usr/bin/env bash
# Read-only diagnostics for the current Neon District Codespace.
# Does not start/stop containers, change port visibility, or print secrets.
set -u

echo "=== Neon District Codespaces diagnostics ==="
printf 'Date (UTC): '; date -u '+%Y-%m-%d %H:%M:%S'
printf 'Codespaces environment: '
if [ -n "${CODESPACES:-}" ]; then echo "detected"; else echo "not detected (may be a local shell)"; fi
printf 'Workspace: %s\n' "${CODESPACE_VSCODE_FOLDER:-${PWD:-unknown}}"
echo

echo "=== OS / CPU ==="
uname -a 2>/dev/null || true
if command -v nproc >/dev/null 2>&1; then printf 'CPU cores visible: '; nproc; fi
echo

echo "=== Memory ==="
if [ -r /proc/meminfo ]; then
  awk '/^(MemTotal|MemAvailable|SwapTotal|SwapFree):/ {printf "%s: %.2f GiB\n", $1, $2/1048576}' /proc/meminfo
else
  echo "Memory details unavailable."
fi
echo

echo "=== Workspace disk ==="
df -h . 2>/dev/null || true
echo

echo "=== Docker availability ==="
if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI: not installed"
elif ! docker info >/dev/null 2>&1; then
  echo "docker CLI: present, but daemon unavailable or permission denied"
else
  echo "docker daemon: available"
  docker version --format 'Client: {{.Client.Version}} / Server: {{.Server.Version}}' 2>/dev/null || true
  echo
  echo "=== Running containers ==="
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
  echo
  echo "=== Neon browser container (if present) ==="
  docker ps -a --filter 'name=nd-personal-browser' --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
  echo
  echo "=== Chromium image (if cached) ==="
  docker image ls 'lscr.io/linuxserver/chromium' --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' 2>/dev/null || true
fi
echo
echo "=== Port 3200 ==="
if command -v ss >/dev/null 2>&1; then
  ss -ltn 2>/dev/null | awk 'NR==1 || $4 ~ /:3200$/'
else
  echo "ss command unavailable; inspect the Codespaces Ports panel."
fi
echo
echo "=== Safe next step ==="
echo "If Docker is available, run: bash browser-lab/start.sh"
echo "Keep forwarded port 3200 PRIVATE. Never paste API tokens, cookies, or environment dumps into chat."
