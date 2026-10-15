'use strict';
// Functional UI/regression cases beyond the all-page smoke checks.
// Browser runner is intentionally isolated: never writes to production.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.ARCADE_TEST_URL||'http://127.0.0.1:8080';
const cases=[
 ['index.html','37-game catalog + Arcade Passport',async p=>{
   assert.equal(await p.locator('#gameCount').innerText(),'37');
   assert.equal(await p.locator('#passportCount').innerText(),'0/37');
   assert.equal(await p.locator('.gameCard').count(),37);
   assert.equal(await p.locator('#passportExplore').count(),1);
 }],
 ['snake.html','Maze mode and 3.0 passport',async p=>{
   await p.locator('[data-mode="maze"]').click();
   await p.locator('#start').click();
   assert.equal((await p.locator('#modeHud').innerText()).toUpperCase(),'MAZE');
   assert.equal(await p.locator('#overlay').isVisible(),false);
   await p.keyboard.press('ArrowUp');
   await p.locator('.nd3-passport').click();
   assert.equal(await p.locator('.nd3-passport-panel').isVisible(),true);
   await p.locator('.nd3-passport-close').click()
 }],
 ['pong.html','2-player match start',async p=>{
   await p.locator('[data-level="versus"]').click();
   assert.equal(await p.locator('#opponentLabel').innerText(),'PLAYER 2');
   await p.locator('#start').click();
   await p.keyboard.press('j');
   await p.keyboard.press('l');
   assert.equal(await p.locator('#overlay').isVisible(),false)
 }],
 ['reaction.html','False starts and reset',async p=>{
   await p.locator('#arena').click();
   await p.locator('#arena').click();
   assert.equal(await p.locator('#falseCount').innerText(),'1');
   await p.locator('#reset').click();
   assert.equal(await p.locator('#falseCount').innerText(),'0')
 }],
 ['tap.html','Survival mode ends on third miss',async p=>{
   await p.locator('[data-mode="survival"]').click();
   await p.locator('#start').click();
   for(let i=0;i<3;i++)await p.locator('#stage').click({position:{x:10,y:10}});
   assert.equal(await p.locator('#overlay').isVisible(),true);
   assert.equal(await p.locator('#time').innerText(),'0/3')
 }],
 ['free-throw.html','10-shot game works',async p=>{
   await p.locator('#start').click();
   await p.locator('#action').click();
   assert.equal(await p.locator('#round').innerText(),'1')
 }],
 ['goalkeeper.html','Keeper controls, shot timer and 10-round scoring',async p=>{
   await p.locator('#start').click();
   await p.locator('#left').click();
   await p.waitForTimeout(2700);
   assert.ok(Number(await p.locator('#round').innerText())>=1)
 }],
 ['laser-defender.html','Ship startup and difficulty HUD',async p=>{
   assert.match(await p.locator('#status').innerText(),/LIVES/);
   await p.locator('[data-diff="hard"]').click();
   await p.locator('#start').click();
   assert.match(await p.locator('#status').innerText(),/LIVES 3/)
 }],
 ['rooftop-run.html','Runner startup and boost HUD',async p=>{
   assert.match(await p.locator('#status').innerText(),/BOOST/);
   await p.locator('#start').click();
   await p.locator('#action').click();
   assert.match(await p.locator('#status').innerText(),/BOOST/)
 }],
 ['breakout.html','Breakout start and paddle movement',async p=>{
   await p.locator('#start').click();
   await p.keyboard.down('ArrowRight');
   await p.waitForTimeout(220);
   await p.keyboard.up('ArrowRight');
   assert.equal(await p.locator('#overlay').isVisible(),false)
 }],
 ['flappy.html','Flappy start, flap input and mode',async p=>{
   await p.locator('#start').click();
   await p.locator('#flap').click();
   assert.equal(await p.locator('#overlay').isVisible(),false)
 }],
 ['space.html','Space game start and fire',async p=>{
   await p.locator('#start').click();
   await p.keyboard.press('Space');
   assert.match(await p.locator('#score').innerText(),/Wave: 1/)
 }],
 ['arcade-city.html','Open world engine solo + new Driver Trials',async p=>{
   await p.waitForTimeout(600);
   await p.locator('#soloBtn').click();
   await p.locator('#nd3Open').click();
   assert.equal(await p.locator('#nd3Cards [data-quest]').count(),3);
   await p.locator('[data-quest="speed"]').click();
   assert.equal(await p.locator('#nd3Mask').isVisible(),false);
   assert.match(await p.locator('#nd3Open').innerText(),/60s/)
 }],
 ['bowling.html','3D Bowling Strike Rush, theme and power meter',async p=>{
   await p.waitForTimeout(350);
   await p.locator('[data-theme="cosmic"]').click();
   assert.equal(await p.locator('[data-theme="cosmic"]').getAttribute('class'),'active');
   await p.locator('#challengeBtn').click();
   assert.match(await p.locator('#modeLabel').innerText(),/STRIKE RUSH/);
   await p.locator('#bowl').click();
   assert.match(await p.locator('#phaseLabel').innerText(),/POWER/);
   await p.locator('#bowl').click();
   assert.match(await p.locator('#phaseLabel').innerText(),/ROLLING/)
 }]
];
(async()=>{
 const b=await chromium.launch({headless:true,args:['--disable-gpu','--use-gl=swiftshader']});
 const failures=[];let passes=0;
 try{
  for(const [path,label,check] of cases){
   const page=await b.newPage({viewport:{width:1280,height:820}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    const r=await page.goto(base+'/'+path,{waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(r.status(),200);
    await check(page);
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS '+label);passes++
   }catch(e){failures.push(label+': '+e.message);console.error('FAIL '+label+': '+e.message)}
   finally{await page.close()}
  }
 }finally{await b.close()}
 console.log('Functional cases passed: '+passes+'/'+cases.length);
 if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
})().catch(e=>{console.error(e);process.exitCode=1});
