#!/usr/bin/env python3
"""Mirror authorized Cork7 static gameplay assets into Neon District GitHub Pages.

The owner's permission to host the game was confirmed by the project maintainer.
This script does not change game logic, accounts, scoring, or network APIs.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import os
import re
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "cork7-assets"
ORIGIN = "https://cork7.com"
PREFIX = "/neon-district/cork7-assets"
DIRECTORIES = ("models", "textures", "items", "images", "onboarding", "music", "brand", "fonts", "sounds", "audio", "updates")
MANDATORY = ("/models/rider-v20.glb", "/updates/snowfall.webp")
SECONDARY = (
    "/models/lift-v1.glb",
    "/models/venue-v1.glb",
    "/models/shirakumo-tram-v1.glb",
    "/models/powder-finish-v1.glb",
    "/textures/rail-painted-steel-v1.webp",
)
ASSET_RE = re.compile(r"/(?:models|textures|items|images|onboarding|music|brand|fonts|sounds|audio|updates)/[a-zA-Z0-9_./-]+\.(?:glb|webp|png|jpg|jpeg|svg|woff2|woff|mp3|ogg|m4a|opus)(?:\?v=\d+)?", re.I)
URL_RE = re.compile(r"(?<![A-Za-z0-9._/-])/(models|textures|items|images|onboarding|music|brand|fonts|sounds|audio|updates)/")
MAX_FILE_BYTES = 95 * 1024 * 1024
MAX_TOTAL_BYTES = 300 * 1024 * 1024


def static_assets():
    result = set(SECONDARY) | set(MANDATORY)
    for path in [ROOT / "cork7.html", *(BUNDLE / "_next/static/chunks").glob("*.js"),
                 *(BUNDLE / "_next/static/css").glob("*.css")]:
        if not path.exists():
            continue
        data = path.read_text(encoding="utf-8")
        # Skip already-rewritten paths; capture upstream paths from both original
        # and new first-party URLs without duplicating a prefix.
        for match in ASSET_RE.finditer(data):
            name = match.group(0).split("?")[0]
            if "${" not in name and ".." not in name:
                result.add(name)
    return sorted(result, key=lambda name: (name not in MANDATORY, name))


def download(relative, required=False):
    target = BUNDLE / relative.lstrip("/")
    if target.is_file() and target.stat().st_size > 1024:
        return target.stat().st_size
    target.parent.mkdir(parents=True, exist_ok=True)
    req = Request(ORIGIN + relative, headers={"User-Agent": "Mozilla/5.0 (compatible; NeonDistrictCork7Mirror/1.0)", "Accept": "*/*"})
    temporary = None
    try:
        with urlopen(req, timeout=55) as response:
            kind = response.headers.get("Content-Type", "").lower()
            if response.status != 200 or "text/html" in kind:
                raise RuntimeError(f"unexpected response status={response.status} content-type={kind}")
            with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as out:
                temporary = Path(out.name)
                total = 0
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > MAX_FILE_BYTES:
                        raise RuntimeError(f"asset exceeds {MAX_FILE_BYTES} byte safety limit")
                    out.write(chunk)
        if total < 128:
            raise RuntimeError("asset is unexpectedly small")
        if relative.endswith(".glb") and temporary.read_bytes()[:4] != b"glTF":
            raise RuntimeError("download is not a valid GLB header")
        temporary.replace(target)
        print(f"ASSET OK {relative}: {total:,} bytes", flush=True)
        return total
    except (HTTPError, URLError, OSError, RuntimeError) as exc:
        print(f"{'REQUIRED' if required else 'OPTIONAL'} ASSET FAILED {relative}: {exc}", file=sys.stderr, flush=True)
        if required:
            raise
        return 0
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def rewrite_urls():
    count = 0
    target_files = [ROOT / "cork7.html", *(BUNDLE / "_next/static/chunks").glob("*.js"),
                    *(BUNDLE / "_next/static/css").glob("*.css")]
    for path in target_files:
        if not path.exists():
            continue
        original = path.read_text(encoding="utf-8")
        updated = URL_RE.sub(lambda m: PREFIX + "/" + m.group(1) + "/", original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            count += 1
            print(f"PATCHED {path.relative_to(ROOT)}", flush=True)
    return count


def main():
    assets = static_assets()
    print(f"Found {len(assets)} static source assets", flush=True)
    total = 0
    for name in assets:
        total += download(name, required=name in MANDATORY)
        if total > MAX_TOTAL_BYTES:
            raise RuntimeError(f"asset mirror exceeds {MAX_TOTAL_BYTES} bytes")
    patched = rewrite_urls()
    rider = BUNDLE / "models/rider-v20.glb"
    assert rider.exists() and rider.read_bytes()[:4] == b"glTF", "Rider GLB not present"
    source = (BUNDLE / "_next/static/chunks/engine-mtSWjbmj.js").read_text(encoding="utf-8")
    assert PREFIX + "/models/rider-v20.glb" in source, "Engine still uses root-relative rider asset URL"
    print(f"COMPLETE: {len(assets)} assets considered; {total:,} bytes present; {patched} files patched.", flush=True)


if __name__ == "__main__":
    main()
