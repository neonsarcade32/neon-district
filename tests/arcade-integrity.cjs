'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=fs.readdirSync(root);
const pages=files.filter(x=>x.endsWith('.html'));
const gamePages=pages.filter(x=>!['index.html','search.html','mp-bridge.html','neon-browser.html'].includes(x));
const index=read('index.html');
const entries=[...index.matchAll(/\bid:'([^']+)',name:'([^']+)',file:'([^']+)'/g)].map(m=>({id:m[1],name:m[2],file:m[3].split('?')[0]}));
let checked=0;
const problems=[];
function expect(condition,message){if(!condition)problems.push(message)}
function checkSyntax(code,mod,label){
  try {
    if(mod){
      const p=cp.spawnSync(process.execPath,['--check','--input-type=module'],{input:code,encoding:'utf8'});
      expect(p.status===0,label+': '+(p.stderr||'module parse failed').trim());
    }else new vm.Script(code,{filename:label});
    checked++;
  }catch(err){problems.push(label+': '+err.message)}
}
expect(index.includes('href="neon-browser.html"'),'Browser Lab not linked from homepage');
const browserLab=read('neon-browser.html');
expect(browserLab.includes('CLOUD BROWSER: UNDER DEVELOPMENT'),'Browser Lab must label cloud service as unavailable');
expect(!browserLab.includes('app.github.dev'),'Browser Lab must not share private Codespaces ports');
expect(browserLab.includes('id="own-browser"'),'Browser Lab must have in-page setup guide');
expect(browserLab.includes('https://github.com/neonsarcade32/neon-district'),'Browser Lab setup should link to repository');
expect(browserLab.includes('bash browser-lab/start.sh'),'Browser Lab guide missing startup command');
expect(browserLab.includes('Keep visibility <strong>Private</strong>'),'Browser Lab guide must keep proxy port private');
expect(browserLab.includes('docker stop nd-personal-browser'),'Browser Lab guide must include stop command');
expect(browserLab.includes('each person starts their own cloud browser'),'Browser Lab must accurately describe session separation');
expect(entries.length===40,'Expected 40 games in catalog; found '+entries.length);
expect(index.includes("id:'cork7',name:'Cork7',file:'cork7.html'"),'Cork7 must appear in game catalog');
const cork7=read('cork7.html');
expect(cork7.includes('<base href="https://cork7.com/">'),'Cork7 must resolve licensed source assets');
expect(cork7.includes('id="nd-cork7-bridge"'),'Cork7 must include inline same-origin navigation bridge');
expect(cork7.includes('game-client-'),'Cork7 must include the original game bootstrap');
expect(cork7.includes('mountain-ride.is-ride'),'Cork7 must support solo park launch');
expect(!cork7.includes("fetch(url,{mode:'cors'"),'Cork7 must not dynamically fetch the upstream HTML at runtime');
expect(!cork7.includes('<iframe'),'Cork7 must not rely on a blocked iframe');
const cork7Bridge=read('cork7-bridge.js');
expect(cork7Bridge.includes('History.prototype'),'Navigation bridge must keep game on Neon District origin');
expect(cork7Bridge.includes('mountain-ride.is-ride'),'Navigation bridge must support solo park launch');
expect(index.includes("id:'neonfreeski',name:'Neon Freeski 3D',file:'neon-freeski.html'"),'Neon Freeski must appear in catalog');
expect(read('neon-freeski.html').includes('neon-freeski.js'),'Native ski game must load its own source');
expect(read('neon-freeski.js').includes('function updateInput'),'Native ski game movement and physics logic missing');
expect(new Set(entries.map(x=>x.id)).size===entries.length,'Duplicate game catalog ID');
expect(new Set(entries.map(x=>x.file)).size===entries.length,'Duplicate game catalog path');
for(const e of entries)expect(fs.existsSync(path.join(root,e.file)),'Missing game page '+e.name+': '+e.file);
for(const f of gamePages)expect(entries.some(e=>e.file===f),'Hidden/unlisted game page: '+f);
const linkedScripts=new Set();
for(const html of pages){
  const src=read(html);
  expect(/<html\b/i.test(src)&&/<title>[^<]+<\/title>/i.test(src),html+': missing HTML/title');
  const refs=[...src.matchAll(/<(script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)];
  for(const ref of refs){
    const raw=ref[2];
    if(/^(?:https?:|\/\/|data:)/i.test(raw))continue;
    // The licensed Cork7 client uses an explicit remote <base>; root-relative assets resolve to cork7.com.
    if(html==='cork7.html' && src.includes('<base href="https://cork7.com/">') && raw.startsWith('/'))continue;
    const file=raw.split(/[?#]/)[0];
    if(!file)continue;
    expect(fs.existsSync(path.join(root,file)),html+': missing static asset '+file);
    if(ref[1].toLowerCase()==='script'&&file.endsWith('.js'))linkedScripts.add(file);
  }
  for(const [n,script] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()){
    if(!script[2].trim())continue;
    // Structured-data JSON is not executable JavaScript.
    if(/\btype=["'](?:application\/ld\+json|application\/json)["']/i.test(script[1]))continue;
    if(/\btype=["']importmap["']/i.test(script[1])) {
      try{const data=JSON.parse(script[2]);expect(data&&typeof data.imports==='object',html+' invalid module importmap')}
      catch(e){problems.push(html+' bad importmap: '+e.message)}
      continue;
    }
    checkSyntax(script[2],/\btype=["']module["']/i.test(script[1]),html+' inline script '+n);
  }
}
for(const js of files.filter(x=>x.endsWith('.js'))){
  if(js==='server.js')continue;
  checkSyntax(read(js),js.startsWith('open-platformer-')||js==='neon-freeski.js',js);
}
// Check exact imported MIT code and data references (no missing level files).
for(const game of ['open-2048','open-platformer','open-offroad']){
 expect(fs.existsSync(path.join(root,game+'.html')),'Missing '+game+' open source game');
}
for(const license of ['third-party-2048-license.txt','third-party-platformer-license.txt','third-party-offroad-license.txt']){
 expect(read(license).includes('MIT'),'Missing required MIT license: '+license);
}
for(const file of ['open-platformer-level1.json','open-platformer-level2.json']){
 try{const parsed=JSON.parse(read(file));expect(Array.isArray(parsed.tiles)&&parsed.tiles.length>=8,'Invalid platformer level '+file)}
 catch(e){problems.push(file+': '+e.message)}
}
const server=read('server.js');
for(const js of linkedScripts)expect(server.includes("'"+js+"'"),'Multiplayer static server does not allow '+js);
expect(!/PUBLIC_GAME_SCRIPTS[^\n]*server\.js/.test(server),'Server source must not be in public JS allowlist');
if(problems.length){console.error('NEON DISTRICT QA FAILED ('+problems.length+' problems)');for(const p of problems)console.error('  - '+p);process.exitCode=1}
else console.log('PASS Neon District 3.0 catalog '+entries.length+'/'+gamePages.length+' games; '+pages.length+' pages; '+checked+' JavaScript syntax checks; linked assets and server routes validated. Browser gameplay and CDN/runtime performance require separate interactive testing.');