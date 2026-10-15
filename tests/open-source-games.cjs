'use strict';
// Real integration checks: imported MIT game code (not iframes or link-outs).
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const origin=process.env.ARCADE_TEST_URL||'http://127.0.0.1:8080';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-gpu','--use-gl=swiftshader']});
 const issues=[];let ok=0;
 async function caseCheck(name,fn){try{await fn();ok++;console.log('PASS '+name)}catch(e){issues.push(name+': '+e.message);console.error('FAIL '+name+': '+e.message)}}
 try{
  await caseCheck('Official MIT 2048: real tile engine initializes and saves independently',async()=>{
   const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   try{
    const r=await p.goto(origin+'/open-2048.html',{waitUntil:'domcontentloaded'});
    assert.equal(r.status(),200);
    await p.waitForFunction(()=>window.nd2048Game?.grid?.availableCells()?.length===14,{timeout:4500});
    assert.equal(await p.locator('.tile').count(),2);
    assert.equal(await p.locator('a[href*="gabrielecirulli/2048"]').count()>0,true);
    const data=await p.evaluate(()=>({score:window.nd2048Game.score,state:localStorage.getItem('nd2048_gameState')}));
    assert.equal(data.score,0);assert.ok(data.state);
    assert.deepEqual(errors,[])
   }finally{await p.close()}
  });
  await caseCheck('Official MIT 2048: actual keyboard merges tiles and preserves score',async()=>{
   const p=await browser.newPage({viewport:{width:1280,height:900}});
   try{
    await p.goto(origin+'/open-2048.html');
    await p.waitForFunction(()=>!!window.nd2048Game,{timeout:3500});
    await p.evaluate(()=>{
     const g=window.nd2048Game;g.grid=new Grid(4);
     g.grid.insertTile(new Tile({x:0,y:0},2));g.grid.insertTile(new Tile({x:1,y:0},2));
     g.score=0;g.over=false;g.won=false;g.keepPlaying=false;g.actuate()
    });
    await p.keyboard.press('ArrowLeft');await p.waitForTimeout(170);
    const data=await p.evaluate(()=>({score:window.nd2048Game.score,hasFour:window.nd2048Game.grid.cells.flat().some(t=>t?.value===4),best:localStorage.getItem('nd2048_bestScore')}));
    assert.equal(data.score,4);assert.ok(data.hasFour);assert.ok(+data.best>=4);
    await p.locator('.restart-button').click();
    await p.waitForTimeout(120);
    assert.equal(await p.evaluate(()=>window.nd2048Game.score),0)
   }finally{await p.close()}
  });
  await caseCheck('Official MIT 2048: mobile controls and screen width',async()=>{
   const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const errs=[];p.on('pageerror',e=>errs.push(e.message));
   try{
    await p.goto(origin+'/open-2048.html');
    await p.waitForFunction(()=>!!window.nd2048Game,{timeout:3500});
    assert.ok(await p.locator('[data-nd2048-dir]').first().isVisible());
    await p.evaluate(()=>{
     const g=window.nd2048Game;g.grid=new Grid(4);
     g.grid.insertTile(new Tile({x:0,y:0},2));g.grid.insertTile(new Tile({x:0,y:1},4));
     g.score=0;g.over=false;g.won=false;g.keepPlaying=false;g.actuate()
    });
    const before=await p.evaluate(()=>JSON.stringify(window.nd2048Game.grid.serialize()));
    await p.locator('[data-nd2048-dir="1"]').click();await p.waitForTimeout(150);
    const after=await p.evaluate(()=>JSON.stringify(window.nd2048Game.grid.serialize()));
    assert.notEqual(before,after,'the on-screen direction should perform a real move');
    const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=12,'mobile viewport should not scroll horizontally: '+overflow);
    assert.deepEqual(errs,[])
   }finally{await p.close()}
  });
  await caseCheck('Pixel Hop Twins: licensed 2-level game source loads actual procedural world',async()=>{
   const p=await browser.newPage({viewport:{width:1250,height:860}});
   const errs=[],missing=[];p.on('pageerror',e=>errs.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url())});
   try{
    assert.equal((await p.goto(origin+'/open-platformer.html',{waitUntil:'domcontentloaded'})).status(),200);
    await p.waitForFunction(()=>window.ndPlatformerGame?._levelData?.length===2&&window.ndPlatformerGame._state==='playing',{timeout:10000});
    const data=await p.evaluate(()=>({levels:window.ndPlatformerGame._levelData.map(v=>v.name),canvas:[document.getElementById('gameCanvas').width,document.getElementById('gameCanvas').height],state:window.ndPlatformerGame._state}));
    assert.equal(data.levels.length,2);assert.deepEqual(data.canvas,[640,400]);assert.equal(data.state,'playing');
    assert.equal(await p.locator('a[href*="stm1978/retro-platformer"]').count()>0,true);
    assert.deepEqual(missing,[]);assert.deepEqual(errs,[])
   }finally{await p.close()}
  });
  await caseCheck('Pixel Hop Twins: keyboard moves the actual imported player',async()=>{
   const p=await browser.newPage({viewport:{width:1250,height:860}});
   try{
    await p.goto(origin+'/open-platformer.html');
    await p.waitForFunction(()=>window.ndPlatformerGame?._state==='playing',{timeout:10000});
    const x=await p.evaluate(()=>window.ndPlatformerGame._player.x);
    await p.keyboard.down('ArrowRight');await p.waitForTimeout(300);await p.keyboard.up('ArrowRight');
    const next=await p.evaluate(()=>window.ndPlatformerGame._player.x);
    assert.ok(next>x+5,'Player should move right by more than 5px: '+x+' -> '+next)
   }finally{await p.close()}
  });
  await caseCheck('Pixel Hop Twins: mobile touch and pause controls work',async()=>{
   const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const errs=[];p.on('pageerror',e=>errs.push(e.message));
   try{
    await p.goto(origin+'/open-platformer.html');
    await p.waitForFunction(()=>window.ndPlatformerGame?._state==='playing',{timeout:10000});
    // Check pause before running into level hazards: the original game can
    // legitimately enter its 'dead' animation after sustained movement.
    await p.locator('[data-platform-tap="KeyP"]').click();
    await p.waitForTimeout(220);
    assert.equal(await p.evaluate(()=>window.ndPlatformerGame._state),'paused');
    await p.locator('[data-platform-tap="KeyP"]').click();
    await p.waitForTimeout(220);
    assert.equal(await p.evaluate(()=>window.ndPlatformerGame._state),'playing');
    const b=p.locator('[data-platform-hold="ArrowRight"]');assert.ok(await b.isVisible());
    const before=await p.evaluate(()=>window.ndPlatformerGame._player.x);
    const r=await b.boundingBox();
    await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.waitForTimeout(300);await p.mouse.up();
    const after=await p.evaluate(()=>window.ndPlatformerGame._player.x);
    assert.ok(after>before+5,'on-screen directional button should move the player');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=12);
    assert.deepEqual(errs,[])
   }finally{await p.close()}
  });
 }finally{await browser.close()}
 console.log('OPEN SOURCE ARCADE GAME REGRESSIONS: '+ok+'/6 passed');
 if(issues.length){console.error(issues.join('\n'));process.exitCode=1}
})().catch(e=>{console.error(e);process.exitCode=1});
