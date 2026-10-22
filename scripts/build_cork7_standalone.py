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
dest.write_text(source.replace(needle,'import{t as i}from"./nd-standalone-vite-preload.js"'))
(chunks/'nd-standalone-vite-preload.js').write_text('export function t(load, deps){return load()}\n')
preload_pattern = re.compile(r'import\\{t as ([A-Za-z_$][A-Za-z0-9_$]*)\\}from"\\./index-CYh2aJIu\\.js"')
for file in chunks.glob('*.js'):
    if file.name.startswith('index-') or file.name.startswith('game-client-') or file.name.startswith('nd-'):
        continue
    text=file.read_text()
    if 'from"./index-CYh2aJIu.js"' not in text:
        continue
    modified,count=preload_pattern.subn(lambda m: 'import{t as '+m.group(1)+'}from"./nd-standalone-vite-preload.js"',text)
    if count==0 or 'from"./index-CYh2aJIu.js"' in modified:
        raise RuntimeError('Unrecognized Vinext import in '+file.name)
    file.write_text(modified)
    print('REMOVED VINEXT BOOTSTRAP FROM',file.name)
print('PASS: game-client standalone module created',dest.stat().st_size)
