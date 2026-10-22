#!/usr/bin/env python3
"""Mirror Cork7 3D game assets into Neon District's first-party static site.

Permission to host these Cork7 assets was confirmed by the site's operator.
This script downloads only game resources and does not alter other arcade games.
"""
from pathlib import Path
import os
import sys
import tempfile
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "cork7-assets"
UPSTREAM = "https://cork7.com/"
MAX_FILE_BYTES = 98_000_000

# Rider is mandatory to start a round. Other geometry improves the mountains.
REQUIRED = (
    "models/rider-v20.glb",
)
OPTIONAL = (
    "models/rails-v2.glb",
    "models/flowline/rails-v2.glb",
    "models/forest-line/rails-v1.glb",
    "models/lift-v1.glb",
    "models/venue-v1.glb",
    "models/shirakumo-tram-v1.glb",
    "models/powder-finish-v1.glb",
    "textures/rail-painted-steel-v1.webp",
)


def download(rel, mandatory):
    output = DEST / rel
    if output.is_file() and output.stat().st_size > 200:
        if not rel.endswith(".glb") or output.read_bytes()[:4] == b"glTF":
            print(f"EXISTS {rel} ({output.stat().st_size:,} bytes)")
            return True

    url = UPSTREAM + rel
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; NeonDistrictCork7Mirror/1.0)",
                 "Accept": "*/*"},
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    tmpname = None
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            total = 0
            with tempfile.NamedTemporaryFile(dir=output.parent, delete=False) as tmp:
                tmpname = tmp.name
                while True:
                    data = response.read(1024 * 1024)
                    if not data:
                        break
                    total += len(data)
                    if total > MAX_FILE_BYTES:
                        raise RuntimeError(f"Asset exceeds GitHub 100MB single-file limit: {rel}")
                    tmp.write(data)
        with open(tmpname, "rb") as f:
            first = f.read(4)
        if rel.endswith(".glb") and first != b"glTF":
            raise RuntimeError(f"Invalid GLB response for {rel}: {first!r}")
        if total < 200:
            raise RuntimeError(f"Suspiciously small asset {rel}: {total} bytes")
        os.replace(tmpname, output)
        print(f"MIRRORED {rel} ({total:,} bytes)")
        return True
    except (Exception) as e:
        print(f"{'REQUIRED ERROR' if mandatory else 'OPTIONAL SKIPPED'} {rel}: {e}",
              file=sys.stderr)
        return False
    finally:
        if tmpname and os.path.exists(tmpname):
            os.unlink(tmpname)


if __name__ == "__main__":
    errors = [p for p in REQUIRED if not download(p, True)]
    for path in OPTIONAL:
        download(path, False)
    if errors:
        sys.exit("Cork7 cannot start until mandatory rider assets download: " + ", ".join(errors))
    print("PASS: Required Cork7 rider model is mirrored locally.")
