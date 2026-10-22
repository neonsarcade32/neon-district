#!/usr/bin/env python3
"""Build the original Cork7 React game without the upstream Vinext RSC host.
Maintains the original first-party game client and 3D game engine modules.
"""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
chunks=root/'cork7-assets/_next/static/chunks'
original=chunks/'game-client-ND-preload-20261022.js'
dest=chunks/'game-client-ND-standalone.js'
source=original.read_text()
needle='import{t as i}from"./index-CYh2aJIu.js"'
assert source.count(needle)==1,'GameClient Vite preload import changed upstream'
# Keep the first-party Ride destination in the GitHub Pages project root.
client=source.replace(needle,'import{t as i}from"./nd-standalone-vite-preload.js"')
park_import='from"./parks-DyCWeej6.js"'
assert client.count(park_import)==1, 'Missing Cork7 park route dependency'
client=client.replace(park_import,'from"./parks-DyCWeej6.js?nd-ridefix=20261022"')
# This static mirror includes MP4 tracks, not OGG. Avoid a failed OGG probe
# and an additional audio request before playback begins on Chromium.
music_choice='this.format=typeof e.canPlayType==`function`&&e.canPlayType(`audio/ogg; codecs=opus`)?`ogg`:`mp4`'
assert client.count(music_choice)==1, 'Music format selector changed upstream'
client=client.replace(music_choice,'this.format=`mp4`')
dest.write_text(client)
(chunks/'nd-standalone-vite-preload.js').write_text('export function t(load, deps){return load()}\n')
extra_index_import = 'import{t as e}from"./index-CYh2aJIu.js"'
for file in chunks.glob('*.js'):
    if file.name.startswith('index-') or file.name.startswith('game-client-') or file.name.startswith('nd-'):
        continue
    text=file.read_text()
    if 'from"./index-CYh2aJIu.js"' not in text:
        continue
    if extra_index_import not in text:
        print('SKIP NON-GAME VINEXT MODULE',file.name)
        continue
    updated=text.replace(extra_index_import,'import{t as e}from"./nd-standalone-vite-preload.js"')
    if 'from"./index-CYh2aJIu.js"' in updated:
        raise RuntimeError('Vinext dependency remains in '+file.name)
    file.write_text(updated)
    print('REMOVED VINEXT BOOTSTRAP FROM',file.name)
print('PASS: game-client standalone module created',dest.stat().st_size)
