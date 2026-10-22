'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const URL = 'https://neonsarcade32.github.io/neon-district/cork7-standalone.html?park=nordryggen&mode=solo&nd_smoke=after-preload-routing';

(async () => {
 const browser = await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
 ]});
 try {
  const context = await browser.newContext({viewport:{width:1180,height:800}});
  const page = await context.newPage();
  const failures=[],consoleErrors=[],models=[];
  page.on('response', response => {
   if (response.url().includes('cork7-assets/models/rider-v20.glb')) {
    models.push({status:response.status(),url:response.url()});
   }
   if(response.status() >= 400 && /cork7-assets|\.glb/.test(response.url())) {
    failures.push(response.status()+' '+response.url());
   }
  });
  page.on('requestfailed', req => {
    if(/cork7-assets|\.glb/.test(req.url())) failures.push((req.failure()?.errorText||'request failed')+' '+req.url());
  });
  page.on('console', msg => {if(msg.type()==='error')consoleErrors.push(msg.text().slice(0,600))});
  console.log('Opening first-party Cork7 '+URL);
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  let ready = false;
  try {await page.waitForSelector('.bc-shell.bc-ready',{timeout:95000});ready=true;}
  catch(e) {console.warn('Cork7 did not reach ready lobby: '+e.message.slice(0,500));}
  const state = await page.evaluate(() => ({
    path:location.pathname, title:document.title,
    ready:!!document.querySelector('.bc-shell.bc-ready'),
    loading:!!document.querySelector('.bc-shell.bc-loading'),
    hasCanvas:!!document.querySelector('.world-canvas canvas'),
    fatal:document.body.innerText.slice(0,3000).match(/(The rider could not load[^\n]*|The game engine could not load[^\n]*|The 3D game could not start[^\n]*)/i)?.[0]||null,
    text:document.body.innerText.slice(0,650)
  }));
  console.log('GAME STATE '+JSON.stringify(state));
  console.log('RIDER REQUESTS '+JSON.stringify(models));
  console.log('FAILED REQUESTS '+JSON.stringify(failures.slice(0,25)));
  console.log('CONSOLE ERRORS '+JSON.stringify(consoleErrors.slice(0,18)));
  fs.mkdirSync('test-artifacts',{recursive:true});
  await page.screenshot({path:'test-artifacts/cork7-live-smoke.png',fullPage:false}).catch(console.warn);
  assert(!state.fatal,'Cork7 has a visible startup failure: '+state.fatal);
  assert(models.some(x=>x.status===200),'Original rider GLB was not successfully loaded from Neon District');
  assert.equal(state.path,'/neon-district/cork7-standalone.html','The user must remain on the embedded Neon District game URL');
  assert(ready && state.ready,'Cork7 did not finish loading 3D rider on a real browser');
  console.log('PASS: Cork7 rider asset 200, React game ready, local URL preserved.');
 }finally {await browser.close();}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
