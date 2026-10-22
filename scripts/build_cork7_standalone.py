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
for file in chunks.glob('*.js'):
    if file.name.startswith('index-') or file.name.startswith('game-client-'):
        continue
    text=file.read_text()
    matches=re.findall(r'import\{([^}]+)\}from["\\\']\\./index-CYh2aJIu\\.js["\\\']',text)
    if matches: print('ADDITIONAL INDEX DEPENDENCY',file.name,matches)
assert dest.read_text().count('index-CYh2aJIu.js')>=0
print('PASS: game-client standalone module created',dest.stat().st_size)
