'use strict';
// Resource audit for the actual Cork7 game bundle on an iPad-sized browser.
// Uses the checked-out GitHub Pages files to avoid deployment timing races.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const { chromium }=require('playwright');

const project=path.resolve(__dirname,'..');
const prefix='/neon-district/';
const types={
 '.html':'text/html', '.js':'text/javascript','.css':'text/css',
 '.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml',
 '.mp4':'video/mp4','.ogg':'audio/ogg','.mp3':'audio/mpeg',
 '.json':'application/json','.woff2':'font/woff2'
};
async function routeLocal(context){
 await context.route('https://neonsarcade32.github.io/neon-district/**',async route=>{
  let uri=new URL(route.request().url());
  let filename;
  try{
   const relative=decodeURIComponent(uri.pathname).slice(prefix.length);
   filename=path.resolve(project,relative);
  }catch {return route.fulfill({status:400,body:'Bad path'});}
  if(!filename.startsWith(project+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
   return route.fulfill({status:404,body:'Missing local first-party asset'});
  }
  return route.fulfill({status:200,path:filename,contentType:types[path.extname(filename)]||'application/octet-stream',
   headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
 });
}
async function audit(browser,park,viewport){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:true});
 await routeLocal(context);
 const page=await context.newPage();
 const missing=new Set(), errors=[], loaded=new Map();
 page.on('response',r=>{
  if(!r.url().startsWith('https://neonsarcade32.github.io/neon-district/'))return;
  const item=new URL(r.url()).pathname;
  if(r.status()>=400)missing.add(r.status()+' '+item);
  else loaded.set(item,r.status());
 });
 page.on('requestfailed',r=>{
  if(r.url().startsWith('https://neonsarcade32.github.io/neon-district/'))errors.push('Request failed: '+r.url()+' '+r.failure()?.errorText);
 });
 page.on('pageerror',e=>errors.push('JS '+e.message));
 const url='https://neonsarcade32.github.io/neon-district/cork7.html?park='+park+'&mode=solo';
 const start=Date.now(),ready=0;
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
  const state=await page.waitForFunction(()=>{
   if(document.getElementById('__next_error__'))return 'fatal';
   if(/The rider could not load|The game engine could not load|The 3D game could not start/i.test(document.body.innerText))return 'fatal';
   const c=document.querySelector('canvas');
   if(c&&c.width>100&&c.height>100&&!document.querySelector('.bc-load-content'))return 'ready';
   return false;
  },undefined,{timeout:90000,polling:600}).then(h=>h.jsonValue()).catch(()=>'timeout');
  if(state==='ready')await page.waitForTimeout(2500);
  const canvas=await page.locator('canvas').count();
  const text=(await page.locator('body').innerText()).slice(-700);
  const critical=[...missing].filter(x=>/\.(glb|js|css)(?:$|\?)/i.test(x)||/\/models\//i.test(x));
  const music=[...missing].filter(x=>/\/music\//i.test(x));
  const summary={park,viewport,state,elapsedMs:Date.now()-start,canvas,
   riderHttp:loaded.get('/neon-district/cork7-assets/models/rider-v20.glb'),
   missing:[...missing].sort(),critical,failedMusic:music,errors:errors.slice(0,12),text};
  console.log('CORK7 AUDIT '+JSON.stringify(summary,null,2));
  fs.mkdirSync(path.join(project,'test-artifacts'),{recursive:true});
  await page.screenshot({path:path.join(project,'test-artifacts','cork7-audit-'+park+'.png'),animations:'disabled',timeout:7500}).catch(e=>console.warn('Optional screenshot unavailable:',e.message.slice(0,110)));
  assert.equal(state,'ready','Cork7 '+park+' must initialize real gameplay');
  assert.equal(summary.riderHttp,200,'Skier model must be loaded locally on '+park);
  assert.equal(critical.length,0,'Missing critical 3D/script/style assets for '+park+': '+critical.join('; '));
  assert.equal(music.length,0,'In-game audio 404 after soundtrack mirror: '+music.join('; '));
  return summary;
 }finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
 ]});
 try{
  const first=await audit(browser,'nordryggen',{width:1024,height:768});
  const second=await audit(browser,'apex',{width:932,height:740});
  console.log('PASS: Two Cork7 parks render skier on touch screens with no missing critical assets or soundtrack requests.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
