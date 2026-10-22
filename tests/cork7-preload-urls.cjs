'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const filename='cork7-assets/_next/static/chunks/index-CYh2aJIu.js';
const source=fs.readFileSync(path.join(root,filename),'utf8');
const m=source.match(/Tl=(function\(e\)\{return [^}]+\}),El=\{\}/);
assert(m,'Cork7 Vite preload resolver must be present');
const resources=[
 '_next/static/css/game-client.Dazi9g4y.css',
 '_next/static/chunks/active-course-BNtD_ETj.js',
 '_next/static/chunks/parks-DyCWeej6.js',
 '_next/static/chunks/live-protocol-Df00aJzl.js',
 '_next/static/chunks/rider-outfit-CyFlaRlo.js'
];
const locations=[
 'https://neonsarcade32.github.io/neon-district/cork7.html?park=nordryggen&mode=solo',
 'https://neonsarcade32.github.io/neon-district/cork7.html',
 'http://127.0.0.1:8841/cork7.html?park=apex&mode=solo'
];
for(const href of locations){
 const resolve=vm.runInNewContext('('+m[1]+')',{URL,window:{location:{href}}});
 for(const resource of resources){
  const actual=resolve(resource);
  const expected=new URL('cork7-assets/'+resource,href).href;
  assert.equal(actual,expected,'Cork7 dynamic import must stay on first-party host: '+resource);
  assert.equal(new URL(actual).origin,new URL(href).origin,'No dynamic Cork7 asset may route to cork7.com');
  assert(fs.existsSync(path.join(root,'cork7-assets',resource)),'Mirrored Cork7 preload is missing: '+resource);
 }
}
const html=fs.readFileSync(path.join(root,'cork7.html'),'utf8');
const versioned='index-CYh2aJIu.js?v=neon-preload-fix-1022';
assert.equal(html.split(versioned).length-1,3,'Cork7 HTML must cache-bust all 3 bootstrap/preload entry references');
console.log('PASS Cork7 lazy-loaded styles and park modules resolve to Neon District: '+locations.length+' origins × '+resources.length+' known failed assets.');
