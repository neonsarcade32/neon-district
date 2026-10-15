'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.ARCADE_TEST_URL||'http://127.0.0.1:8080';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-gpu','--use-gl=swiftshader']});
 const page=await browser.newPage({viewport:{width:1240,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let n=0;const check=(title,assertion)=>{assertion();n++;console.log('PASS '+title)};
 async function snapshot(){return page.evaluate(()=>window.__bowlingQA.snapshot())}
 async function releaseFrame(count){return page.evaluate(count=>window.__bowlingQA.testRoll(count),count)}
 async function ready(){await page.waitForFunction(()=>window.__bowlingQA?.snapshot().phase==='setup',{timeout:7000})}
 try{
  const response=await page.goto(base+'/bowling.html?qa=1',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200);
  await page.locator('#classicBtn').click();
  let s=await snapshot();
  check('3D bowling initializes real fresh rack at center',()=>{assert.equal(s.playerX,0);assert.equal(s.pinsStanding,10);assert.equal(s.phase,'setup')});
  assert.equal(await page.evaluate(()=>window.__bowlingQA.setLine(1.8,.62,-.8)),true);
  assert.equal(await releaseFrame(10),true);
  s=await snapshot();
  check('strike finishes frame immediately and locks input',()=>{assert.equal(s.frameIndex,1);assert.equal(s.phase,'resetting');assert.equal(s.strikes,1)});
  check('strike cannot be spammed during pinsetter cycle',()=>assert.equal(s.phase,'resetting'));
  assert.equal(await releaseFrame(10),false);
  assert.equal(await page.locator('#bowl').isDisabled(),true);
  await ready();s=await snapshot();
  check('post-strike reset centers ball, angle, and hook',()=>{
   assert.equal(s.playerX,0);assert.equal(s.aim,0);assert.equal(s.hook,0);
   assert.equal(s.pinsStanding,10);assert.equal(s.phase,'setup')
  });
  assert.equal(await page.evaluate(()=>window.__bowlingQA.setLine(-1.4,-.55,.9)),true);
  assert.equal(await releaseFrame(10),true);
  await ready();s=await snapshot();
  check('consecutive strike still recenters for each new rack',()=>{
   assert.equal(s.frameIndex,2);assert.equal(s.playerX,0);assert.equal(s.pinsStanding,10);
   assert.equal(s.strikes,2)
  });
  assert.equal(await releaseFrame(5),true);
  await ready();s=await snapshot();
  check('non-strike first roll retains exactly five standing pins',()=>{
   assert.equal(s.frameIndex,2);assert.equal(s.pinsStanding,5);
   assert.equal(s.frames[2].rolls[0],5)
  });
  assert.equal(await releaseFrame(5),true);
  await ready();s=await snapshot();
  check('spare advances and resets complete rack',()=>{
   assert.equal(s.frameIndex,3);assert.equal(s.frames[2].rolls.join(','),'5,5');
   assert.equal(s.pinsStanding,10);assert.equal(s.playerX,0);assert.equal(s.spares,1)
  });
  // Tenth-frame fill balls: a strike followed by 5 leaves five standing pins for the last ball.
  assert.equal(await page.evaluate(()=>window.__bowlingQA.jumpToTenth()),true);
  assert.equal(await releaseFrame(10),true);
  await ready();s=await snapshot();
  check('tenth-frame strike correctly sets a fresh rack',()=>{assert.equal(s.frameIndex,9);assert.equal(s.pinsStanding,10);assert.equal(s.frames[9].rolls.join(','),'10')});
  assert.equal(await releaseFrame(5),true);
  await ready();s=await snapshot();
  check('tenth-frame second non-strike preserves remaining pins for third ball',()=>{assert.equal(s.frameIndex,9);assert.equal(s.pinsStanding,5);assert.equal(s.frames[9].rolls.join(','),'10,5')});
  assert.equal(await releaseFrame(5),true);
  s=await snapshot();
  check('tenth-frame final bonus ball scores 20 without phantom points',()=>assert.equal(s.frames[9].rolls.join(','),'10,5,5'));
  assert.equal(await page.locator('#resultScore').innerText(),'20');
  await page.locator('#againBtn').click();
  s=await snapshot();
  check('new game wipes previous rack, retains stored high scores',()=>{assert.equal(s.frameIndex,0);assert.equal(s.playerX,0);assert.equal(s.pinsStanding,10)});
  await page.locator('#bowl').click();
  check('releasing a real physics-driven shot enters power phase',()=>{});
  assert.equal((await snapshot()).phase,'power');
  await page.locator('#bowl').click();
  assert.equal((await snapshot()).phase,'rolling');
  await page.waitForFunction(()=>['settling','resetting','setup','score'].includes(window.__bowlingQA.snapshot().phase),{timeout:10000});
  await ready();
  s=await snapshot();
  check('physics-driven roll resolves and eventually re-arms controls',()=>{
   assert.equal(s.frames[0].rolls.length,1);
   assert.ok(s.frames[0].rolls[0]>=0&&s.frames[0].rolls[0]<=10);
   assert.equal(s.shotLaunchCount,1);assert.equal(s.phase,'setup')
  });
  assert.deepEqual(errors,[],'No uncaught browser JavaScript exceptions');
  console.log('PASS '+n+' Bowling 3.1 integration contracts, including consecutive strikes, pinsetter reset, spare, tenth-frame bonus and real roll')
 }finally{await page.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
