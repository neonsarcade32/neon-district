'use strict';
// Browser smoke test: opens every published game and checks that core controls
// load without uncaught JavaScript errors or missing local scripts.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.ARCADE_TEST_URL||'http://127.0.0.1:8080';
const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const games=[...index.matchAll(/\bid:'([^']+)',name:'([^']+)',file:'([^']+)'/g)].map(m=>({id:m[1],name:m[2],file:m[3]}));
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-gpu','--use-gl=swiftshader']});
  const failures=[];
  try{
    for(const g of games){
      const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
      const pageErrors=[],missingScripts=[];
      page.on('pageerror',e=>pageErrors.push(e.message));
      page.on('response',r=>{
        if(r.status()>=400&&r.request().resourceType()==='script'&&new URL(r.url()).origin===new URL(base).origin)missingScripts.push(r.status()+' '+r.url());
      });
      try{
        const response=await page.goto(base+'/'+g.file,{waitUntil:'domcontentloaded',timeout:25000});
        assert.equal(response.status(),200,'game HTML should load');
        assert.ok((await page.title()).trim(),'nonempty game title');
        await page.waitForTimeout(g.id==='city'||g.id==='bowling'?1500:350);
        const start=page.locator('#start');
        if(await start.count()&&await start.isVisible()){
          await start.click({timeout:1500}).catch(()=>{});
          await page.waitForTimeout(200);
        }
        if(pageErrors.length||missingScripts.length)throw Error([...pageErrors,...missingScripts].join(' | '));
        console.log('PASS '+g.name);
      }catch(e){failures.push(g.name+': '+e.message);console.error('FAIL '+g.name+': '+e.message)}
      finally{await page.close()}
    }
    // Mobile viewport coverage for keyboard, canvas and touch-focused games.
    for(const g of ['snake.html','pong.html','reaction.html','tap.html','bowling.html']){
      const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
      try{
        const resp=await page.goto(base+'/'+g,{waitUntil:'domcontentloaded',timeout:25000});
        assert.equal(resp.status(),200);
        assert.ok(await page.locator('body').isVisible());
        console.log('PASS mobile '+g);
      }catch(e){failures.push('mobile '+g+': '+e.message)}
      finally{await page.close()}
    }
    // Targeted gameplay checks for systems that previously looked loaded but were inert.
    async function gameplay(file,label,fn){
      const page=await browser.newPage({viewport:{width:1180,height:840}});
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      try{
        await page.goto(base+'/'+file,{waitUntil:'domcontentloaded',timeout:25000});
        await page.waitForTimeout(file==='bowling.html'||file==='arcade-city.html'?1800:250);
        await fn(page);
        assert.deepEqual(errors,[],'no gameplay JavaScript errors');
        console.log('PASS interactive '+label);
      }catch(err){failures.push('interactive '+label+': '+err.message);console.error('FAIL interactive '+label+': '+err.message)}
      finally{await page.close()}
    }
    await gameplay('snake.html','Snake maze',async p=>{
      await p.locator('[data-mode="maze"]').click();
      await p.locator('#start').click();
      assert.equal((await p.locator('#modeHud').innerText()).trim(),'MAZE');
      await p.keyboard.press('ArrowUp');
      await p.waitForTimeout(250);
    });
    await gameplay('pong.html','Pong two players',async p=>{
      await p.locator('[data-level="versus"]').click();
      assert.equal((await p.locator('#opponentLabel').innerText()).trim(),'PLAYER 2');
      await p.locator('#start').click();
      await p.keyboard.press('j');
      await p.waitForTimeout(200);
    });
    await gameplay('tap.html','Tap Survival scoring',async p=>{
      await p.locator('[data-mode="survival"]').click();
      await p.locator('#start').click();
      await p.locator('#target').click();
      assert.ok(Number(await p.locator('#score').innerText())>0);
      assert.equal((await p.locator('#time').innerText()).trim(),'3/3');
    });
    await gameplay('reaction.html','Reaction false starts',async p=>{
      await p.locator('#arena').click();
      await p.locator('#arena').click();
      assert.equal((await p.locator('#falseCount').innerText()).trim(),'1');
    });
    await gameplay('free-throw.html','Free Throw 10-shot logic',async p=>{
      await p.locator('#start').click();
      await p.keyboard.press('Space');
      assert.ok(Number(await p.locator('#round').innerText())>=1);
    });
    await gameplay('goalkeeper.html','Goalkeeper 10-save logic',async p=>{
      await p.locator('#start').click();
      await p.waitForTimeout(1000);
      await p.keyboard.press('Space');
      assert.ok(Number(await p.locator('#round').innerText())>=1);
    });
    await gameplay('laser-defender.html','Laser controls and lives',async p=>{
      await p.locator('#start').click();
      assert.match(await p.locator('#status').innerText(),/LIVES/);
      await p.keyboard.press('Space');
      await p.waitForTimeout(200);
    });
    await gameplay('rooftop-run.html','Rooftop run progression',async p=>{
      await p.locator('#start').click();
      assert.match(await p.locator('#status').innerText(),/BOOST/);
      await p.waitForTimeout(220);
      assert.ok(Number(await p.locator('#score').innerText())>0);
    });
    await gameplay('arcade-city.html','Arcade City solo entry',async p=>{
      await p.locator('#soloBtn').click();
      assert.equal(await p.locator('#menuShade').evaluate(el=>getComputedStyle(el).display),'none');
    });
    await gameplay('bowling.html','Bowling classic game entry',async p=>{
      await p.locator('#classicBtn').click();
      assert.equal(await p.locator('#menuShade').evaluate(el=>getComputedStyle(el).display),'none');
      assert.ok(await p.locator('#bowl').isVisible());
    });
  }finally{await browser.close()}
  if(failures.length){console.error('\n'+failures.length+' browser smoke failures:\n'+failures.join('\n'));process.exitCode=1}
  else console.log('\nPASS all '+games.length+' games opened; mobile smoke checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
