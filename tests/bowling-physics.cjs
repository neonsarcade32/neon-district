'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const physics=await import('../bowling-physics.mjs');
 const {PIN_LAYOUT,createRack,createShot,stepPhysics,simulateShot,knockedCount,movingEnergy,STEP}=physics;
 let tests=0;const check=(name,fn)=>{fn();tests++;console.log('PASS '+name)};
 check('ten properly arranged pins and independent per-rack state',()=>{
  assert.equal(PIN_LAYOUT.length,10);const a=createRack(),b=createRack();
  assert.equal(a.length,10);assert.equal(new Set(a.map(p=>p.id)).size,10);
  a[0].fallen=true;assert.equal(knockedCount(a),1);assert.equal(knockedCount(b),0)
 });
 check('ball must physically approach and collide before pins count',()=>{
  const p=createRack(),s=createShot({x:0,aim:0,power:.65});
  for(let i=0;i<35;i++)stepPhysics(s,p,STEP);
  assert.equal(knockedCount(p),0);assert.ok(s.z>0)
 });
 check('dead-center throw does NOT grant automatic strike',()=>{
  const r=simulateShot({x:0,aim:0,hook:0,power:.65});
  assert.ok(r.down>0&&r.down<10,'straight middle ball should not be scripted to clear 10 pins');
  assert.ok(r.events.some(e=>e.type==='ball-pin'));
  assert.ok(r.events.some(e=>e.type==='pin-pin'))
 });
 check('pocket location physically rewards a precise ball',()=>{
  const mid=simulateShot({x:0,aim:0,hook:0,power:.65});
  const pocket=simulateShot({x:.2,aim:0,hook:0,power:.65});
  assert.ok(pocket.down>mid.down, 'pocket throw must outperform centerline');
  assert.equal(pocket.down,10,'accurate pocket can genuinely strike via collisions')
 });
 check('gutter ball never touches or scores pins',()=>{
  const r=simulateShot({x:2.3,aim:1,hook:.2,power:.8});
  assert.ok(r.gutter);assert.equal(r.down,0);assert.equal(r.shot.contactCount,0)
 });
 check('off-target throw can leave spare pins',()=>{
  const r=simulateShot({x:-1.5,aim:0,hook:0,power:.8});
  assert.ok(r.down<10,'non-pocket shots leave standing pins')
 });
 check('pinsetter respects standing-pin mask for a spare ball',()=>{
  const mask=[true,false,true,false,true,false,false,false,false,false];
  const rack=createRack(mask);
  assert.equal(rack.filter(p=>p.active).length,3);
  const r=simulateShot({x:0,aim:0,power:.7},mask);
  assert.ok(r.down<=3);assert.ok(r.pins.every((p,i)=>p.active===mask[i]))
 });
 check('collision state is finite for extreme aiming, power and hook',()=>{
  for(let n=0;n<64;n++){
   const x=-2.2+(n%9)*.55, aim=-1+(n%7)/3,hook=-1+(n%11)/5,power=(n%10)/9;
   const r=simulateShot({x,aim,hook,power});
   assert.ok(r.down>=0&&r.down<=10);
   for(const p of r.pins)for(const k of ['x','y','z','vx','vz','tip'])assert.ok(Number.isFinite(p[k]),k);
   for(const k of ['x','y','z','vx','vz'])assert.ok(Number.isFinite(r.shot[k]),k)
  }
 });
 check('no randomness or concealed strike-target budget',()=>{
  const a=simulateShot({x:-.25,aim:.08,hook:.21,power:.7});
  const b=simulateShot({x:-.25,aim:.08,hook:.21,power:.7});
  assert.equal(a.down,b.down);assert.deepEqual(a.pins.map(p=>p.fallen),b.pins.map(p=>p.fallen));
  const html=fs.readFileSync(path.resolve(__dirname,'..','bowling.html'),'utf8');
  assert.ok(!html.includes('knockTarget='));
  assert.ok(!html.includes('pinCarryBudget--'));
  assert.ok(html.includes('stepPhysics(shot,physicalPins,STEP)'));
  assert.ok(html.includes('queueRackReset(true)'));
 });
 check('pin physics continues after ball leaves frame',()=>{
  const rack=createRack(),shot=createShot({x:.2,aim:0,power:.75});
  for(let i=0;i<660&&!shot.finished;i++)stepPhysics(shot,rack,STEP);
  assert.ok(shot.finished,'shot should leave the playable lane');
  const prior=rack.map(p=>p.x);
  for(let i=0;i<60;i++)stepPhysics(shot,rack,STEP);
  assert.ok(rack.some((p,i)=>Math.abs(p.x-prior[i])>.0001),'pins continue moving after the ball leaves');
  assert.ok(movingEnergy(rack)>=0)
 });
 check('shots start from requested player position and speed follows chosen power',()=>{
  const low=createShot({x:2.1,power:.1}),high=createShot({x:2.1,power:.95});
  assert.equal(low.x,2.1);assert.ok(high.speed>low.speed);assert.ok(high.vz<low.vz);
  assert.ok(Math.abs(createShot({aim:0}).vx)<1e-8)
 });
 console.log('PASS '+tests+' physics contracts; real ball/pin collision engine, repeat-shot fairness, gutter physics and rack integrity')
})().catch(e=>{console.error(e);process.exitCode=1});
