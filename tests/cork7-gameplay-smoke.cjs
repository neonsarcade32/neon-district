'use strict';
// Live game startup smoke test. Captures the resource errors on failure.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({
   headless:true,
   args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']
 });
 const dest=path.join(__dirname,'..','test-artifacts');
 fs.mkdirSync(dest,{recursive:true});
 const url=process.env.CORK7_SMOKE_URL||'https://neonsarcade32.github.io/neon-district/cork7.html?park=nordryggen&mode=solo';
 const page=await browser.newPage({viewport:{width:1180,height:760}});
 const issues=[],rider=[];
 page.on('pageerror',e=>issues.push('JS '+e.message));
 page.on('console',m=>{if(m.type()==='error')issues.push('Console '+m.text().slice(0,200))});
 page.on('requestfailed',r=>issues.push('Request failed '+r.url()+' '+(r.failure()?.errorText||'')));
 page.on('response',r=>{
    if(/rider-v20\.glb/.test(r.url()))rider.push({url:r.url(),status:r.status()});
    if(r.status()>=400&&/cork7-assets|\/models\//.test(r.url()))issues.push('HTTP '+r.status()+' '+r.url());
 });
 try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
    let result='timeout';
    try{
      const handle=await page.waitForFunction(()=>{
        const text=document.body?.innerText||'';
        if(text.includes('The rider could not load.'))return 'rider-error';
        if(text.includes('The game engine could not load.'))return 'engine-error';
        if(text.includes('The 3D game could not start.'))return 'renderer-error';
        const canvas=document.querySelector('canvas');
        if(canvas&&canvas.width>100&&canvas.height>100&&!document.querySelector('.bc-load-content'))return 'canvas-ready';
        return false;
      },undefined,{timeout:75000,polling:700});
      result=await handle.jsonValue();
    }catch(e){issues.push('Readiness timeout '+e.message.slice(0,150));}
    await page.screenshot({path:path.join(dest,'cork7-gameplay-smoke.png'),fullPage:true}).catch(()=>{});
    const summary={url,screen:result,rider,canvasCount:await page.locator('canvas').count(),lastText:(await page.locator('body').innerText()).slice(-550),issues:issues.slice(-28)};
    console.log(JSON.stringify(summary,null,2));
    assert(rider.some(x=>x.status===200&&x.url.includes('/neon-district/cork7-assets/models/')),'Rider GLB must load from Neon District at HTTP 200');
    assert.equal(result,'canvas-ready','Cork7 must reach a rendered gameplay canvas after the model loads');
    console.log('PASS Cork7 rider downloads from first-party GitHub Pages and gameplay canvas initializes.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
