'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const filename='cork7-assets/_next/static/chunks/index-ND-preload-20261022.js';
const source=fs.readFileSync(path.join(root,filename),'utf8');
const resolver='Tl=function(e){return new URL(`../../../`+e,import.meta.url).href}';
assert(source.includes(resolver),'Cork7 Vite preload resolver must be anchored to the JS module, not the page or upstream base');

const resources=[
 '_next/static/css/game-client.Dazi9g4y.css',
 '_next/static/css/shop-board.COTUkOfh.css',
 '_next/static/chunks/active-course-BNtD_ETj.js',
 '_next/static/chunks/parks-DyCWeej6.js',
 '_next/static/chunks/live-protocol-Df00aJzl.js',
 '_next/static/chunks/rider-outfit-CyFlaRlo.js'
];
const roots=[
 'https://neonsarcade32.github.io/neon-district',
 'http://127.0.0.1:8841'
];
for(const origin of roots){
 const moduleUrl=origin+'/cork7-assets/_next/static/chunks/index-ND-preload-20261022.js';
 for(const resource of resources){
  const actual=new URL('../../../'+resource,moduleUrl).href;
  const expected=origin+'/cork7-assets/'+resource;
  assert.equal(actual,expected,'Cork7 dynamic preload must stay on first-party origin: '+resource);
  assert(fs.existsSync(path.join(root,'cork7-assets',resource)),'Mirrored Cork7 resource missing: '+resource);
 }
}
const html=fs.readFileSync(path.join(root,'cork7.html'),'utf8');
assert(html.includes('id="nd-cork7-cachefix-importmap"'),'Cork7 must remap cached original imports');
assert(html.includes('cork7-standalone.js'),'Cork7 must start its native first-party game runtime');
const nativeBoot=fs.readFileSync(path.join(root,'cork7-standalone.js'),'utf8');
assert(nativeBoot.includes('game-client-ND-standalone.js'),'Cork7 must load its standalone original game module');
assert(fs.existsSync(path.join(root,'cork7-assets/_next/static/chunks/game-client-ND-standalone.js')),'Cork7 native game bundle must exist');
assert(!html.includes('index-CYh2aJIu.js?v=neon-preload-fix-1022'),'Old Vite preload cache URL must not remain in the launch HTML');
console.log('PASS Cork7 mirrors '+resources.length+' CSS/JS dependencies on '+roots.length+' origins, and uses its native standalone original game bundle.');
