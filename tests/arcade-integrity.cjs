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
const gamePages=pages.filter(x=>!['index.html','search.html','mp-bridge.html'].includes(x));
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
expect(entries.length===35,'Expected 35 games in catalog; found '+entries.length);
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
    const file=raw.split(/[?#]/)[0];
    if(!file)continue;
    expect(fs.existsSync(path.join(root,file)),html+': missing static asset '+file);
    if(ref[1].toLowerCase()==='script'&&file.endsWith('.js'))linkedScripts.add(file);
  }
  for(const [n,script] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()){
    if(!script[2].trim())continue;
    checkSyntax(script[2],/\btype=["']module["']/i.test(script[1]),html+' inline script '+n);
  }
}
for(const js of files.filter(x=>x.endsWith('.js'))){
  if(js==='server.js')continue;
  checkSyntax(read(js),false,js);
}
const server=read('server.js');
for(const js of linkedScripts)expect(server.includes("'"+js+"'"),'Multiplayer static server does not allow '+js);
expect(!/PUBLIC_GAME_SCRIPTS[^\n]*server\.js/.test(server),'Server source must not be in public JS allowlist');
if(problems.length){console.error('NEON DISTRICT QA FAILED ('+problems.length+' problems)');for(const p of problems)console.error('  - '+p);process.exitCode=1}
else console.log('PASS Neon District 3.0 catalog '+entries.length+'/'+gamePages.length+' games; '+pages.length+' pages; '+checked+' JavaScript syntax checks; linked assets and server routes validated. Browser gameplay and CDN/runtime performance require separate interactive testing.');
