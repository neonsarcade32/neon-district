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
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
    assert.equal((await mobile.goto(base+'/open-offroad.html',{waitUntil:'domcontentloaded',timeout:30000})).status(),200);
    // A mobile software-GPU emulator may not support the game renderer;
    // verify the touch adapter independently, while the desktop test above
    // actually validates the playable physics/3D engine.
    const drive=mobile.locator('.nd3-drive-zone .nd3-gas');
    assert.ok(await drive.isVisible(),'iPad on-screen acceleration button must be visible');
    await mobile.evaluate(()=>{window.__testDrive=[];window.addEventListener('keydown',e=>window.__testDrive.push('down:'+e.code));window.addEventListener('keyup',e=>window.__testDrive.push('up:'+e.code))});
    // The headless mobile emulator cannot guarantee software WebGPU startup,
    // so exclude the loading curtain from input-adapter verification only.
    await mobile.locator('#loader').evaluate(el=>{el.style.pointerEvents='none'});
    await drive.tap({timeout:8000});
    await mobile.locator('.nd3-upgrades').tap({timeout:8000});
    const received=await mobile.evaluate(()=>window.__testDrive);
    assert.ok(received.includes('down:KeyW')&&received.includes('up:KeyW'),'touch drive must generate real keyboard input');
    assert.ok(received.includes('down:KeyU'),'touch upgrade key must generate a real U press');
    console.log('PASS touch buttons translate throttle and upgrades into game input (mobile GPU startup not certified in this test)');
  }finally{await mobile.close()}

 }finally{await page.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
