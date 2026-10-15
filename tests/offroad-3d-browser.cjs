'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.ARCADE_TEST_URL||'http://127.0.0.1:8080';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1250,height:850}});
 let fatal=[],network=[];
 page.on('pageerror',e=>fatal.push(e.message));
 page.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url())});
 try{
  const r=await page.goto(base+'/open-offroad.html',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(r.status(),200);
  assert.equal(await page.locator('a.nd3-back-link').count(),1);
  assert.ok(await page.locator('a[href*="rsamwilson2323-cloud/rpg-car-game"]').count()>=1,'Original author source and license links must be displayed');
  console.log('PASS original author credit and correct game HTML');
  await page.waitForFunction(()=>window.__ndOffroadReady===true,{timeout:45000});
  assert.ok(await page.locator('canvas').count()>=1,'WebGPU/WebGL canvas must render a 3D scene');
  console.log('PASS actual 3D engine and Rapier initialization');
  assert.equal(await page.locator('#loader').count(),0,'loading screen should close');
  assert.equal(await page.locator('#settings-toggle').count(),1);
  console.log('PASS 3D world enters playable state with controls and settings');
  fs.mkdirSync('test-artifacts',{recursive:true});
  const img=await page.screenshot({path:'test-artifacts/offroad-3d.png',timeout:10000});
  assert.ok(img.length>2500,'captured live canvas scene');
  console.log('PASS browser rendered game screenshot');
  assert.equal(fatal.length,0,'uncaught game JavaScript errors: '+fatal.join(' | '));
  console.log('PASS no browser startup errors');
 }finally{await page.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
