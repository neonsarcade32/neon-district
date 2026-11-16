#!/usr/bin/env python3
"""One-time, narrowly scoped Cork7 public client snapshot refresh.
Does not copy official music tracks or proprietary font files.
Only run with the documented developer integration permission.
"""
from pathlib import Path
from collections import deque
import urllib.request
import re
import json

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/"cork7-assets"
STATIC=ASSETS/"_next"/"static"
ORIGIN="https://cork7.com"
BUNDLE="game-client-DVXJxJr_.js"
CSS=["index.Brj9LuMv.css","game-client.Dtg5MW41.css"]
HDR={"User-Agent":"Mozilla/5.0"}
def grab(rel,limit=9000000):
    url=ORIGIN+"/"+rel.lstrip("/")
    with urllib.request.urlopen(urllib.request.Request(url,headers=HDR),timeout=30) as res:
        buf=res.read(limit+1)
    if not 50<=len(buf)<=limit:
        raise RuntimeError("Unexpected public asset size: "+rel)
    return buf
def patch(path,old,new,required=True):
    src=path.read_text(encoding="utf-8")
    if required and old not in src:
        raise RuntimeError("Unexpected code at "+str(path.relative_to(ROOT))+": "+old[:65])
    if old in src: path.write_text(src.replace(old,new),encoding="utf-8")
html=grab("",1000000).decode("utf-8")
if "_next/static/chunks/"+BUNDLE not in html:
    raise RuntimeError("Upstream game-client version changed: perform a new independent review.")
pattern=re.compile(r"(?<![A-Za-z0-9_])(?:/)?_next/static/(?:chunks|css)/[A-Za-z0-9._-]+\.(?:js|css)")
queue=deque(sorted(set(m.group(0).lstrip("/") for m in pattern.finditer(html))))
queue.append("_next/static/chunks/"+BUNDLE)
seen=set()
downloaded=[]
while queue:
    rel=queue.popleft()
    if rel in seen: continue
    seen.add(rel)
    if len(seen)>130: raise RuntimeError("Asset graph unexpectedly large.")
    target=ASSETS/rel
    target.parent.mkdir(parents=True,exist_ok=True)
    if not target.exists():
        target.write_bytes(grab(rel))
        downloaded.append(rel)
    src=target.read_bytes().decode("utf-8",errors="replace")
    if rel.endswith(".js"):
        for m in pattern.finditer(src):
            dep=m.group(0).lstrip("/")
            if dep not in seen:queue.append(dep)
        for name in re.findall(r"(?<![A-Za-z0-9_./-])\./([A-Za-z0-9_.-]+\.js)",src):
            dep="_next/static/chunks/"+name
            if dep not in seen:queue.append(dep)
for name in CSS+["shop-board.CnQljQ5d.css"]:
    target=STATIC/"css"/name
    if target.exists():
        patch(target,"url(/_next/static/media/","url(../media/",required=False)
tick=chr(96)
patch(STATIC/"chunks"/"index-DDTcHn_b.js",
      "Tl=function(e){return"+tick+"/"+tick+"+e}",
      "Tl=function(e){return new URL("+tick+"cork7-assets/"+tick+"+e,document.baseURI).href}")
client=STATIC/"chunks"/BUNDLE
src=client.read_text(encoding="utf-8")
for path in ["/onboarding/","/brand/","/updates/"]:
    src=src.replace(path,ORIGIN+path)
client.write_text(src,encoding="utf-8")
patch(STATIC/"chunks"/"patch-notes-TRV0WPtE.js","/updates/",ORIGIN+"/updates/",required=False)

grabs=["lu-kang-v1","back-tip-v54","rocket-v35","true-nose-v171","bak-hodet-v1","tail-style-v1"]
sound=["rail-loop","glide-slow-loop","glide-medium-loop","glide-fast-loop","wind-loop",
"clothes-slow-loop","clothes-medium-loop","clothes-fast-loop","tbar-loop","cabin-loop",
"slope-loop","butter-loop"]
for stem,n in [("rail-on",4),("rail-off",3),("land-light",3),("land-medium",3),
("land-heavy",3),("crash-fall",2),("crash-roll",4),("binding-pop",2),
("swish-soft",6),("swish-hard",4),("stop",4),("passby",1),("takeoff",4),
("slam",3),("gear",3),("rail-slam",3),("butter-press",4)]:
    sound += [stem+"-"+str(i) for i in range(1,n+1)]
static_paths=(["grabs/"+name+".json" for name in grabs]
 + ["sfx/"+name+".ogg" for name in sound]
 + ["items/poles/bmx-grip.glb","items/gloves/park-mitten.glb"])
for rel in static_paths:
    dest=ASSETS/rel
    dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists():dest.write_bytes(grab(rel,2500000))

cork7=ROOT/"cork7.html"
patch(cork7,"(models|textures)","(models|textures|grabs|sfx|items)")
for old,new in [("index.DBvX0VVq.css","index.Brj9LuMv.css"),
("game-client.Dazi9g4y.css","game-client.Dtg5MW41.css"),
("game-client-ND-standalone.js?nd-neonpeak-fix=20261026-v3",BUNDLE+"?nd-c7-20261116"),
("cork7-standalone.js?v=neonpeak-fix-20261026-v3","cork7-standalone.js?v=cork7-live-20261116"),
("cork7-assets/_next/static/chunks/game-client-ND-standalone.js'","cork7-assets/_next/static/chunks/"+BUNDLE+"'")]:
    patch(cork7,old,new)
patch(ROOT/"cork7-standalone.js",
    "game-client-ND-standalone.js?nd-neonpeak-fix=20261026-v3",
    BUNDLE+"?nd-c7-20261116")
sw=ROOT/"cork7-offline-sw.js"
patch(sw,"nd-cork7-static-v8","nd-cork7-static-v9")
for old,new in [("index.DBvX0VVq.css","index.Brj9LuMv.css"),
("game-client.Dazi9g4y.css","game-client.Dtg5MW41.css"),
("game-client-ND-standalone.js",BUNDLE),
("game-client-ND-preload-20261022.js","index-DDTcHn_b.js"),
("active-course-neonpeak-fix-20261026-v3.js","active-course-BafOXpaU.js"),
("supabase-BEhtaJUq.js","supabase-DUDiAKuD.js")]:
    patch(sw,old,new)
q="'cork7-assets/_next/static/chunks/framework-D_rUT4EX.js',"
insert=q+"\n  'cork7-assets/_next/static/chunks/rolldown-runtime-C60lm6uB.js',\n  'cork7-assets/_next/static/chunks/engine-DSsJCQCD.js',\n  'cork7-assets/grabs/tail-style-v1.json',"
patch(sw,q,insert)

manifest={"snapshot_date":"2026-11-16","upstream":ORIGIN+"/","release_notes":ORIGIN+"/updates",
"game_client":BUNDLE,"style_files":CSS,
"verified":["Latest lobby shows Tail Style by Robin",
"APEX solo skiing reaches gameplay on desktop Chromium/Edge",
"APEX solo skiing reaches gameplay on emulated iPad Chromium/Edge"],
"limits":["Cork7 music tracks and proprietary font files are not mirrored",
"Official account, party and multiplayer features depend on Cork7 servers and may require cork7.com",
"This is a dated snapshot, not a live automatic upstream mirror"]}
(ASSETS/"SNAPSHOT.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")

test=ROOT/"tests"/"arcade-integrity.cjs"
addition="""const c7Snapshot=JSON.parse(read('cork7-assets/SNAPSHOT.json'));
expect(cork7.includes(c7Snapshot.game_client),'Current Cork7 client must be preloaded');
expect(read('cork7-standalone.js').includes(c7Snapshot.game_client),'Cork7 standalone must use current upstream client');
expect(read('cork7-offline-sw.js').includes(c7Snapshot.game_client),'Offline worker must track current client');
for(const f of ['tail-style-v1.json','bak-hodet-v1.json']){
  expect(fs.existsSync(path.join(root,'cork7-assets/grabs',f)),'Latest Cork7 grab animation missing: '+f);
}
for(const f of ['rail-loop.ogg','glide-medium-loop.ogg']){
  expect(fs.existsSync(path.join(root,'cork7-assets/sfx',f)),'Cork7 game sound effect missing: '+f);
}
"""
patch(test,"const cork7=read('cork7.html');",
      "const cork7=read('cork7.html');\n"+addition)

test=ROOT/"tests"/"cork7-preload-urls.cjs"
old="""assert(nativeBoot.includes('game-client-ND-standalone.js'),'Cork7 must load its standalone original game module');
assert(fs.existsSync(path.join(root,'cork7-assets/_next/static/chunks/game-client-ND-standalone.js')),'Cork7 native game bundle must exist');"""
new="""const live=JSON.parse(fs.readFileSync(path.join(root,'cork7-assets/SNAPSHOT.json'),'utf8'));
assert(nativeBoot.includes(live.game_client),'Cork7 bootstrap must import the currently captured official game client');
assert(html.includes(live.game_client),'Cork7 HTML must preload the current client');
assert(fs.existsSync(path.join(root,'cork7-assets/_next/static/chunks',live.game_client)),'Latest Cork7 client bundle is missing');
const currentIndex=fs.readFileSync(path.join(root,'cork7-assets/_next/static/chunks/index-DDTcHn_b.js'),'utf8');
assert(currentIndex.includes('new URL('),'Current Cork7 preload resolver must preserve the first-party repository path');"""
patch(test,old,new)
patch(test,"and uses its native standalone original game bundle.","and uses its verified current standalone game bundle.")

readme=ROOT/"README.md"
text=readme.read_text(encoding="utf-8")
text += """
## Cork7 snapshot refresh — 16 November 2026

Neon District's in-site Cork7 client was refreshed from the official public build
served by https://cork7.com/ on 16 November 2026. The game uses the current
game-client-DVXJxJr_.js and updated CSS/chunks, new grab animations,
cosmetic models and sound effects. cork7-assets/SNAPSHOT.json
records the observed upstream bundle and verification scope.

Local Chromium/Edge tests confirmed the November "Tail Style by Robin" lobby
and a functional APEX solo run on desktop and emulated iPad. The static
catalog integrity tests verify the recorded bundle and assets.

This is a dated first-party-hosted snapshot, not automatic synchronization.
Cork7's music tracks and proprietary fonts were not redistributed. Those
optional resources may not load from the mirror. Account sign-in, parties,
ranked and official multiplayer depend on Cork7's upstream service and may
only work fully at https://cork7.com/. Preserve the developer's permission
and original credits when performing any future refresh.
"""
readme.write_text(text,encoding="utf-8")
print(json.dumps({"bundles":len(seen),"downloaded":len(downloaded),"public_media_files":len(static_paths),"snapshot":BUNDLE}),flush=True)
