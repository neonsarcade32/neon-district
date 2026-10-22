#!/usr/bin/env python3
"""Mirror Cork7's CC-attributed soundtrack files for the authorized static host.

The game already includes track names, artists, source links and CC-BY credits.
The browser audio player requests MP4 as a fallback on iPad/Safari.
Download just those nine MP4 files; don't mirror other third-party media.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import os
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "cork7-assets/music"
ORIGIN = "https://cork7.com/music/"
TRACKS = (
    "quasarise", "ambivert", "synthetic", "kinetics",
    "hello-night", "dawn", "a-journey-through-the-universe",
    "if-we-could-meet-again", "bittersweet"
)
MAX_TRACK_BYTES = 25 * 1024 * 1024
MAX_TOTAL_BYTES = 140 * 1024 * 1024

def valid_mp4(filepath):
    if not filepath.is_file() or filepath.stat().st_size < 5000:
        return False
    with filepath.open("rb") as stream:
        head = stream.read(32)
    return b"ftyp" in head[:12] or b"moov" in head[:16] or b"ID3" in head[:4]

def mirror(track):
    output = DEST / (track + ".mp4")
    if valid_mp4(output):
        print(f"EXISTING {output.name}: {output.stat().st_size:,} bytes", flush=True)
        return output.stat().st_size
    tmp_path = None
    try:
        req = Request(ORIGIN + track + ".mp4", headers={
            "User-Agent": "Mozilla/5.0 (compatible; NeonDistrictCork7Mirror/1.0)",
            "Accept": "audio/mp4,video/mp4,*/*",
        })
        with urlopen(req, timeout=55) as response:
            media_type = response.headers.get("Content-Type", "").lower()
            if response.status != 200 or "text/html" in media_type or "application/json" in media_type:
                raise RuntimeError(f"Unexpected response {response.status}, type={media_type}")
            with tempfile.NamedTemporaryFile(dir=DEST, delete=False) as dest:
                tmp_path = Path(dest.name)
                total = 0
                while True:
                    block = response.read(1024 * 1024)
                    if not block:
                        break
                    total += len(block)
                    if total > MAX_TRACK_BYTES:
                        raise RuntimeError(f"Track over safety limit ({MAX_TRACK_BYTES})")
                    dest.write(block)
        if not valid_mp4(tmp_path):
            raise RuntimeError("Not a recognized MP4/M4A audio container")
        os.replace(tmp_path, output)
        print(f"MIRRORED {output.name}: {total:,} bytes", flush=True)
        return total
    except (HTTPError, URLError, RuntimeError, OSError) as exc:
        print(f"UNAVAILABLE {track}: {exc}", file=sys.stderr, flush=True)
        return 0
    finally:
        if tmp_path and tmp_path.exists():
            tmp_path.unlink()

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    total = 0
    available = 0
    for track in TRACKS:
        received = mirror(track)
        if received:
            available += 1
            total += received
        if total > MAX_TOTAL_BYTES:
            raise RuntimeError(f"Music mirror exceeds {MAX_TOTAL_BYTES} byte budget.")
    print(f"Music ready: {available}/{len(TRACKS)} tracks, {total:,} total bytes.", flush=True)
    if not available:
        raise RuntimeError("No soundtracks mirrored; Cork7 music would still show Track unavailable.")

if __name__ == "__main__":
    main()
