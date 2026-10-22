/* Neon Freeski 3D — original Neon District gameplay and procedural assets.
   Independent implementation; not Cork7 source code, assets, accounts, or network services. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const TAU = Math.PI * 2;
const LENGTH = 1600;
const keys = new Set();
const parkNames = {park:'PARK RUN',forest:'FOREST LINE',bigair:'BIG AIR'};
const settings = {
  park: {slope: .082, trees: 190, boost: 1, tint:0xe8faff},
  forest: {slope: .079, trees: 300, boost: 1, tint:0xe4f5fb},
  bigair: {slope: .091, trees: 135, boost: 1.65, tint:0xebf8ff}
};
let mode = 'park', started = false, paused = true, over = false;
let score = 0, best = 0, combo = 0, lastFeature = '', activeRail = null, currentGrab = 0;
let lastFrame = 0, toastUntil = 0, trailIndex = 0, fpsClock = 0, frameCounter = 0;
let lastGamepadJump = false, lastUiTime = 0;
const player = {
 x:0, y:0, z:0, speed:12, yaw:0, pitch:0, roll:0,
 vy:0, airborne:false, pop:0, airtime:0, peak:0, totalSpin:0,
 totalFlip:0, totalRoll:0, grabs:0, railTime:0, crashes:0
};
try{best=Number(localStorage.getItem('nd3_freeski_best')||0)||0}catch(_){}
$('best').textContent=best.toLocaleString();
const wrap=$('viewport'),screen=$('screen'),startBtn=$('start'),heading=screen.querySelector('h1');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.22;
wrap.appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x99d6f2);
scene.fog=new THREE.FogExp2(0xb5dfeb,.00195);
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,1700);
const hemi=new THREE.HemisphereLight(0xe5f5ff,0x43738c,2.4);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d6,2.45);sun.position.set(-180,260,350);scene.add(sun);
const sunlight=new THREE.Mesh(new THREE.SphereGeometry(22,24,16),new THREE.MeshBasicMaterial({color:0xffedbf,fog:false}));
sunlight.position.set(-310,350,850);scene.add(sunlight);
const world=new THREE.Group();scene.add(world);
const material=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const snow=material(0xe4f7ff),snowBlue=material(0xbedced),wood=material(0x344a58),signMat=material(0x163957),skiMat=material(0x141f39,.55);
const accentMat=material(0x4de7da,.45),railMat=new THREE.MeshStandardMaterial({color:0x87b5c8,metalness:.87,roughness:.18});
const darkGreen=material(0x1d6160),green2=material(0x348885),stoneMat=material(0x6c8a9a);
let course=new THREE.Group();world.add(course);
let features=[],obstacles=[],rails=[],terrain=null,decor=[];
const rnd=(seed=1)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const random=rnd(1234);
const mm=new THREE.Matrix4(),pt=new THREE.Vector3(),qq=new THREE.Quaternion(),ss=new THREE.Vector3();
function heightAt(x,z){
 const slope=settings[mode].slope;
 const natural=1.15*Math.sin(z/63+x/93)+.8*Math.cos(x/31-z/95)+.33*Math.sin(z/20+x/31);
 const edge=3.8*Math.pow(Math.abs(x)/240,3);
 return 98-z*slope+natural+edge;
}
function mesh(geometry,mat,parent,x=0,y=0,z=0) {
 const object=new THREE.Mesh(geometry,mat);
 object.position.set(x,y,z);
 parent.add(object);
 return object;
}
function box(parent,w,h,d,mat,x=0,y=0,z=0){
 return mesh(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z);
}
function labelTexture(text,sub,bg='#0e3b50'){
 const c=document.createElement('canvas');c.width=512;c.height=192;
 const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,192);
 ctx.fillStyle='#7feeff';ctx.fillRect(0,0,512,9);
 ctx.textAlign='center';ctx.fillStyle='#f4ffff';ctx.font='900 63px Arial';ctx.fillText(text,256,94);
 ctx.fillStyle='#a2e4ef';ctx.font='700 25px Arial';ctx.fillText(sub,256,143);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function label(parent,x,y,z,title,subtitle,width=6){
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,width*.375),new THREE.MeshBasicMaterial({map:labelTexture(title,subtitle),side:THREE.DoubleSide,transparent:false}));
 plane.position.set(x,y,z);plane.rotation.y=Math.PI;
 parent.add(plane);return plane;
}
function makeTerrain(){
 const terrainGeo=new THREE.PlaneGeometry(520,LENGTH+220,82,220);
 terrainGeo.rotateX(-Math.PI/2);
 terrainGeo.translate(0,0,LENGTH/2-15);
 const pos=terrainGeo.attributes.position;
 const cols=[];
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),h=heightAt(x,z);
  pos.setY(i,h);
  const shade=.92+.035*Math.sin(x/15+z/18)+.016*Math.sin(x/4+z/7);
  const c=new THREE.Color(settings[mode].tint);c.multiplyScalar(shade);cols.push(c.r,c.g,c.b);
 }
 pos.needsUpdate=true;
 terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 terrainGeo.computeVertexNormals();
 snow.vertexColors=true;
 terrain=mesh(terrainGeo,snow,course);
}
function makeRamps(){
 const configs=[
  {z:108,x:0,width:12,lift:2.8},
  {z:308,x:-7,width:13,lift:3.4},
  {z:520,x:15,width:11,lift:2.6},
  {z:735,x:0,width:16,lift:4.8},
  {z:985,x:-15,width:12,lift:3.4},
  {z:1245,x:11,width:18,lift:5.2}
 ];
 if(mode==='bigair'){configs[0].lift=5.4;configs[3].lift=8.6;configs[5].lift=10.2}
 for(let i=0;i<configs.length;i++){
  const k=configs[i],z=k.z,x=k.x,half=k.width/2,start=z-21,end=z+3;
  const p=[
    x-half,heightAt(x-half,start)+.05,start,
    x+half,heightAt(x+half,start)+.05,start,
    x-half,heightAt(x-half,end)+k.lift,end,
    x+half,heightAt(x+half,end)+k.lift,end
  ];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setIndex([0,1,2,2,1,3]);g.computeVertexNormals();
  const ramp=mesh(g,new THREE.MeshStandardMaterial({color:0xccecff,side:THREE.DoubleSide,roughness:.78}),course);
  const edge1=mesh(new THREE.BoxGeometry(.21,.23,25),accentMat,course,x-half,heightAt(x-half,z-10)+.9,z-10);
  edge1.rotation.x=-.03;
  mesh(new THREE.BoxGeometry(.21,.23,25),accentMat,course,x+half,heightAt(x+half,z-10)+.9,z-10).rotation.x=-.03;
  features.push({type:'kicker',x,z:end,width:half-.75,lift:k.lift,used:false,lead:start,index:i});
  label(course,x-13,heightAt(x-13,start)+4,start,'KICKER '+(i+1),'SPACE TO POP',5);
  box(course,.2,2,.2,signMat,x-13,heightAt(x-13,start)+2,start);
  // Rails beside alternate jumps, with support posts and grindable surface.
  if(i<5){
   const rx=x+(i%2===0?19:-19),rz=z+61,rl=24;
   const ry=heightAt(rx,rz)+1.6;
   const bar=mesh(new THREE.CylinderGeometry(.13,.13,rl,10),railMat,course,rx,ry,rz+rl*.5);
   bar.rotation.x=Math.PI/2;
   for(const rz1 of [rz+4,rz+rl-4]){
    const hh=ry-heightAt(rx,rz1);
    mesh(new THREE.CylinderGeometry(.09,.1,hh,8),wood,course,rx,ry-hh*.5,rz1);
   }
   rails.push({x:rx,z:rz,len:rl,y:ry});
  }
 }
}
function makeForest(){
 const seed=mode==='forest'?6482:mode==='bigair'?3377:5813;
 const rand=rnd(seed);
 const count=settings[mode].trees;
 const trunkGeo=new THREE.CylinderGeometry(.18,.28,1,5),coneGeo=new THREE.ConeGeometry(1,2,7);
 const trunk=new THREE.InstancedMesh(trunkGeo,wood,count);
 const top=new THREE.InstancedMesh(coneGeo,darkGreen,count);
 const lower=new THREE.InstancedMesh(coneGeo,green2,count);
 trunk.frustumCulled=false;top.frustumCulled=false;lower.frustumCulled=false;
 for(let i=0;i<count;i++){
  const z=19+rand()*(LENGTH-10);
  let x=(rand()>.5?1:-1)*(mode==='forest'?27+rand()*210:38+rand()*202);
  const inLane=(mode==='forest' && z>390 && z<610 && Math.abs(x)<37);
  if(inLane)x+=(x<0?-18:18);
  const scale=.85+rand()*1.65;
  const y=heightAt(x,z);
  pt.set(x,y+scale*.58,z);ss.set(scale,scale*1.1,scale);mm.compose(pt,qq,ss);trunk.setMatrixAt(i,mm);
  pt.set(x,y+scale*2,z);ss.set(scale*1.35,scale*1.35,scale*1.35);mm.compose(pt,qq,ss);top.setMatrixAt(i,mm);
  pt.set(x,y+scale*1.24,z);ss.set(scale*1.5,scale*1.05,scale*1.5);mm.compose(pt,qq,ss);lower.setMatrixAt(i,mm);
  if(Math.abs(x)<54)obstacles.push({x,z,r:1.15*scale});
 }
 trunk.instanceMatrix.needsUpdate=top.instanceMatrix.needsUpdate=lower.instanceMatrix.needsUpdate=true;
 course.add(trunk,top,lower);
 const rockCount=70;const rockGeo=new THREE.DodecahedronGeometry(1,0);
 const rocks=new THREE.InstancedMesh(rockGeo,stoneMat,rockCount);rocks.frustumCulled=false;
 for(let i=0;i<rockCount;i++){
  const z=40+rand()*(LENGTH-40),x=(rand()>.5?1:-1)*(31+rand()*130),s=.55+rand()*.85;
  pt.set(x,heightAt(x,z)+.24*s,z);ss.set(s*1.9,s*.57,s*1.55);mm.compose(pt,qq,ss);rocks.setMatrixAt(i,mm);
  if(Math.abs(x)<50)obstacles.push({x,z,r:1.25*s});
 }
 rocks.instanceMatrix.needsUpdate=true;course.add(rocks);
}
function makeDecor(){
 const blue=material(0x24c5e8),orange=material(0xff815c),flag=material(0xfcdf78);
 for(let z=70;z<LENGTH;z+=105){
  for(const side of [-1,1]){
   const x=side*(mode==='forest'?29:45),y=heightAt(x,z);
   box(course,.08,3,.08,wood,x,y+1.5,z);
   const flagM=box(course,1.45,.65,.04,side<0?blue:orange,x+side*.72,y+2.4,z);
   flagM.rotation.y=side*.16;
  }
 }
 const gateZ=LENGTH-25;
 for(const x of [-13,13]){
  const y=heightAt(x,gateZ);
  box(course,.6,9,.6,signMat,x,y+4.5,gateZ);
 }
 const y=heightAt(0,gateZ);
 box(course,26,1.5,.5,accentMat,0,y+8.2,gateZ);
 label(course,0,y+8.3,gateZ-.4,'FINISH','NEON FREESKI 3D',11);
 for(let i=0;i<16;i++){
  const z=100+i*115,s=8+i%3*2;
  const x=300*(i%2?1:-1)+(i%5)*17;
  const geo=new THREE.ConeGeometry(s*7,s*13,5);
  mesh(geo,material(0x799fb0),course,x,heightAt(0,z)+s*2,z);
 }
}
function rebuildCourse(){
 course.traverse(o=>{if(o.isMesh){if(o.geometry)o.geometry.dispose();
  // Instance meshes use shared material; material cache is intentionally retained.
 }});
 world.remove(course);course=new THREE.Group();world.add(course);
 features=[];obstacles=[];rails=[];makeTerrain();makeRamps();makeForest();makeDecor();
}
const avatarYaw=new THREE.Group();scene.add(avatarYaw);
const avatar=new THREE.Group();avatarYaw.add(avatar);
const suit=material(0x34d9ea),helmet=material(0x17294b),pants=material(0x5147a2),skin=material(0xf6b58f);
const skiGeometry=new THREE.BoxGeometry(.19,.09,2.5);
for(const x of [-.27,.27]){
 const ski=mesh(skiGeometry,skiMat,avatar,x,-.06,.15);
 box(avatar,.2,.11,.45,accentMat,x,.04,-.10);
 box(avatar,.27,.55,.38,pants,x,.49,-.08);
 box(avatar,.19,.31,.5,helmet,x,.22,.25);
}
mesh(new THREE.CapsuleGeometry(.43,.9,5,8),suit,avatar,0,1.4,-.02);
const head=mesh(new THREE.SphereGeometry(.34,12,9),skin,avatar,0,2.4,.03);
mesh(new THREE.SphereGeometry(.36,12,9,0,Math.PI*2,0,Math.PI*.46),helmet,avatar,0,2.48,.03);
const goggles=box(avatar,.55,.14,.14,signMat,0,2.41,.29);
for(const s of [-1,1]){
 const arm=mesh(new THREE.CylinderGeometry(.105,.10,.88,7),suit,avatar,s*.54,1.44,.14);arm.rotation.z=s*.5;
 const pole=mesh(new THREE.CylinderGeometry(.023,.035,2.2,6),wood,avatar,s*.84,.52,.3);
 pole.rotation.x=.2;
}
const shadow=mesh(new THREE.CircleGeometry(1.15,28),new THREE.MeshBasicMaterial({color:0x174665,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}),scene);
shadow.rotation.x=-Math.PI/2;
const powderGeo=new THREE.SphereGeometry(.18,5,4),powderMat=new THREE.MeshBasicMaterial({color:0xd9f8ff,transparent:true,opacity:.72,depthWrite:false});
const powder=Array.from({length:36},()=>{const p=mesh(powderGeo,powderMat.clone(),scene);p.visible=false;return {mesh:p,life:0}});
function emitPowder(){
 if(player.airborne||activeRail)return;
 for(let j=0;j<2;j++){
  const sp=powder[trailIndex++%powder.length];sp.mesh.visible=true;sp.life=.64;
  sp.mesh.position.set(player.x+(random()-.5)*.6,player.y+.17,player.z-1+(random()-.5));
  sp.mesh.scale.setScalar(.65+random()*.85);sp.mesh.material.opacity=.6;
 }
}
function animatePowder(dt){
 for(const s of powder){if(s.life<=0)continue;s.life-=dt;s.mesh.position.y+=dt*.65;
  s.mesh.scale.multiplyScalar(1+dt*.8);s.mesh.material.opacity=clamp(s.life/.65,0,.65);
  if(s.life<=0)s.mesh.visible=false;
 }
}
function setMessage(title,pts='',danger=false){
 $('trickName').textContent=title;
 $('trickPoints').textContent=pts;
 $('trickPoints').style.color=danger?'#ffb9ab':'#b0fdda';
 toastUntil=performance.now()+1550;
 $('trickToast').classList.add('show');
}
function reset(){
 score=0;combo=0;activeRail=null;lastFeature='';over=false;
 Object.assign(player,{x:0,z:0,speed:12,yaw:0,pitch:0,roll:0,vy:0,
 airborne:false,pop:0,airtime:0,peak:0,totalSpin:0,totalFlip:0,totalRoll:0,grabs:0,railTime:0,crashes:0});
 player.y=heightAt(0,0)+.12;
 for(const k of features)k.used=false;
 for(const sp of powder)sp.life=0,sp.mesh.visible=false;
 keys.clear();toastUntil=0;
}
function startGame(){
 mode=document.querySelector('.choice.active')?.dataset.park||'park';
 rebuildCourse();reset();started=true;paused=false;screen.hidden=true;
 lastFrame=performance.now();wrap.focus();requestAnimationFrame(frame);
}
function showScreen(state){
 paused=true;screen.hidden=false;
 const choices=screen.querySelector('.choices'),p=screen.querySelector('.micro');
 if(state==='end'){
  over=true;heading.innerHTML='LINE<br><span>COMPLETE.</span>';
  screen.querySelector('.panel>p').innerHTML='Finished '+parkNames[mode]+' with <strong class="stats">'+score.toLocaleString()+' points</strong>, '+player.crashes+' falls, and a best of '+best.toLocaleString()+'.';
  choices.style.display='grid';startBtn.textContent='RIDE AGAIN →';
  p.textContent='Original Neon District game. Your personal best is saved on this device.';
 } else if(state==='paused'){
  heading.innerHTML='PAUSED<br><span>ON THE HILL.</span>';
  screen.querySelector('.panel>p').textContent='Take a break, resume your line, or restart from the summit.';
  choices.style.display='none';startBtn.textContent='RESUME RIDE →';
  p.textContent='Press P or Escape to resume.';
 } else {
  heading.innerHTML='FIND YOUR<br><span>LINE.</span>';
  choices.style.display='grid';startBtn.textContent='DROP IN →';
 }
}
function togglePause(){
 if(!started||over)return;
 if(paused){screen.hidden=true;paused=false;lastFrame=performance.now();requestAnimationFrame(frame);wrap.focus()}
 else showScreen('paused');
}
function launch(power,reason){
 if(player.airborne && !activeRail)return;
 player.airborne=true;activeRail=null;player.vy=power;
 player.y=Math.max(player.y,heightAt(player.x,player.z)+.4);
 player.airtime=0;player.peak=0;player.totalSpin=0;player.totalFlip=0;player.totalRoll=0;player.grabs=0;
 player.pop=0;currentGrab=0;
 if(reason==='kicker')setMessage('KICKER!','HOLD A/D OR W/S TO TRICK');
}
function land(){
 player.airborne=false;
 const spin=player.totalSpin,flip=player.totalFlip,roll=player.totalRoll;
 const yawError=Math.abs(Math.atan2(Math.sin(player.yaw),Math.cos(player.yaw)));
 const spinAligned=Math.min(yawError,Math.abs(Math.PI-yawError))<.76;
 const flipAligned=Math.abs(Math.atan2(Math.sin(player.pitch),Math.cos(player.pitch)))<.7;
 const rollAligned=Math.abs(Math.atan2(Math.sin(player.roll),Math.cos(player.roll)))<.72;
 if((spin+flip+roll)>1.5&&!spinAligned||!flipAligned||!rollAligned){
  crash('ROUGH LANDING');return;
 }
 const spins=Math.floor((spin+0.3)/(Math.PI));
 const flips=Math.floor((flip+0.3)/TAU);
 const rolls=Math.floor((roll+0.3)/TAU);
 const deg=spins*180;
 const trickScore=Math.floor((spins?spins*spins*315:0)+(flips*1800)+(rolls*1900)+player.airtime*90+player.peak*25);
 if(trickScore>100 || player.airtime>1.2){
  const points=Math.round((trickScore+Math.min(350,player.airtime*60))*(player.grabs?1.25:1)*(1+combo*.18));
  score+=points;combo=Math.min(combo+1,7);
  const trick=(flips?'FRONT / BACK FLIP + ':'')+(rolls?'SIDE FLIP + ':'')+(deg?deg+'° SPIN':'AIR')+(player.grabs?' + GRAB':'');
  setMessage(trick,'+'+points.toLocaleString());
 }
 player.yaw=THREE.MathUtils.euclideanModulo(player.yaw+Math.PI,TAU)-Math.PI;
 if(Math.abs(player.yaw)>1.6)player.yaw=player.yaw>0?1.1:-1.1;
 player.pitch=0;player.roll=0;player.vy=0;player.y=heightAt(player.x,player.z)+.12;
}
function crash(reason){
 player.airborne=false;activeRail=null;player.vy=0;player.pitch=0;player.roll=0;
 player.totalSpin=player.totalFlip=player.totalRoll=0;player.yaw=0;player.speed=9;player.crashes++;
 combo=0;player.y=heightAt(player.x,player.z)+.12;
 setMessage(reason,'LINE LOST',true);
}
function updateHud(time){
 if(time-lastUiTime<80)return;lastUiTime=time;
 $('speed').textContent=Math.round(player.speed*3.6);
 $('score').textContent=score.toLocaleString();
 $('combo').textContent='×'+(1+combo*.25).toFixed(2);
 $('progress').style.width=clamp(player.z/LENGTH*100,0,100)+'%';
 $('distance').textContent=Math.max(0,Math.ceil(LENGTH-player.z))+' M TO FINISH';
 $('mapPlayer').style.left=(50+clamp(player.x/4,-43,43))+'%';
 $('mapPlayer').style.top=(15+clamp(player.z/LENGTH*68,0,68))+'%';
 $('airStatus').textContent=player.airborne?'AIRTIME '+player.airtime.toFixed(1)+' S':activeRail?'RAIL SLIDE':parkNames[mode];
 if(score>best){best=score;$('best').textContent=best.toLocaleString();try{localStorage.setItem('nd3_freeski_best',best)}catch(_){}}
}
function updateInput(dt){
 let steer=Number(keys.has('KeyD')||keys.has('ArrowRight')&&!player.airborne)-Number(keys.has('KeyA')||keys.has('ArrowLeft')&&!player.airborne);
 let tuck=keys.has('KeyW')||keys.has('ArrowUp');
 let brake=keys.has('KeyS')||keys.has('ArrowDown');
 let spin=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
 let flip=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));
 let roll=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
 const pad=navigator.getGamepads?.()?.find(Boolean);
 if(pad){
  const axis=pad.axes?.[0]||0;
  if(Math.abs(axis)>.12){steer=axis;spin=axis}
  tuck ||=!!pad.buttons?.[7]?.pressed;
  brake ||=!!pad.buttons?.[6]?.pressed;
  flip+=Number(!!pad.buttons?.[7]?.pressed)-Number(!!pad.buttons?.[6]?.pressed);
  roll+=pad.axes?.[2]||0;
  const jump=!!pad.buttons?.[0]?.pressed;
  if(jump)keys.add('GamepadSpace');else keys.delete('GamepadSpace');
  lastGamepadJump=jump;
 }else{keys.delete('GamepadSpace');lastGamepadJump=false}
 const pressingSpace=keys.has('Space')||keys.has('GamepadSpace');
 if(pressingSpace&&!player.airborne){player.pop=Math.min(1.15,player.pop+dt);}
 if(activeRail){
  player.speed=Math.max(15,player.speed);
  player.x+=(activeRail.x-player.x)*Math.min(1,dt*13);
  player.z+=player.speed*dt;player.y=activeRail.y+.35;
  player.railTime+=dt;
  if(!pressingSpace&&player.pop>0.02){launch(7+player.pop*4,'rail')}
  else if(player.z>activeRail.z+activeRail.len){
   const pts=Math.round(player.railTime*625*(1+combo*.17));
   score+=pts;combo=Math.min(combo+1,7);setMessage('RAIL GRIND','+'+pts);
   activeRail=null;launch(5.2,'rail');
  }
  return;
 }
 if(player.airborne){
  player.airtime+=dt;
  player.y+=player.vy*dt;player.vy-=15.8*dt;
  player.x+=Math.sin(player.yaw)*player.speed*dt*.55;
  player.z+=Math.cos(player.yaw)*player.speed*dt;
  player.yaw+=spin*4.9*dt;player.pitch+=flip*3.8*dt;player.roll+=roll*4.3*dt;
  player.totalSpin+=Math.abs(spin*4.9*dt);
  player.totalFlip+=Math.abs(flip*3.8*dt);
  player.totalRoll+=Math.abs(roll*4.3*dt);
  if(keys.has('KeyQ')||keys.has('KeyE')||keys.has('ShiftLeft')||pad?.buttons?.[4]?.pressed)player.grabs++;
  player.peak=Math.max(player.peak,player.y-heightAt(player.x,player.z));
  if(player.y<=heightAt(player.x,player.z)+.12 && player.vy<0)land();
 }else{
  const speedScale=(.72+player.speed*.028);
  player.yaw=clamp(player.yaw+steer*dt*speedScale,-1.34,1.34);
  const down=Math.max(.3,Math.cos(player.yaw));
  const acceleration=3.6*down+(tuck?7.8:0)-(brake?17.5:0)-.009*player.speed*player.speed;
  player.speed=clamp(player.speed+acceleration*dt,5,mode==='bigair'?52:43);
  player.x+=Math.sin(player.yaw)*player.speed*dt;
  player.z+=Math.cos(player.yaw)*player.speed*dt;
  player.y=heightAt(player.x,player.z)+.12;
  if(!pressingSpace&&player.pop>0.08)launch(6.2+player.pop*4.25,'pop');
  for(const f of features){
   if(f.used)continue;
   if(player.z>=f.z && player.z-f.z<player.speed*dt+1.5 && Math.abs(player.x-f.x)<f.width){
    f.used=true;launch((8.2+f.lift*1.25)*settings[mode].boost,'kicker');lastFeature='kicker';break;
   }
  }
  if(!player.airborne){
   for(const r of rails){
    if(player.z>r.z&&player.z<r.z+2.5&&Math.abs(player.x-r.x)<1.4 && player.speed>10){
     activeRail=r;player.railTime=0;player.y=r.y+.35;setMessage('RAIL CONTACT','HOLD YOUR LINE');break;
    }
   }
   if(player.z>25)for(const o of obstacles){
    if(Math.abs(player.z-o.z)<1.5&&Math.abs(player.x-o.x)<o.r+.28){crash('TREE / ROCK HIT');player.x+=(player.x>=o.x?2:-2);break;}
   }
  }
 }
 player.x=clamp(player.x,-245,245);
 if(player.z>LENGTH-22){
  player.z=LENGTH-22;
  paused=true;showScreen('end');
 }
}
function animateAvatar(dt){
 avatarYaw.position.set(player.x,player.y,player.z);
 avatarYaw.rotation.y=player.yaw;
 avatar.rotation.x=player.pitch;avatar.rotation.z=player.roll+(player.airborne?0:clamp((Number(keys.has('KeyA'))-Number(keys.has('KeyD')))*.16,-.16,.16));
 shadow.position.set(player.x,heightAt(player.x,player.z)+.045,player.z);
 shadow.material.opacity=clamp(.16-(player.y-heightAt(player.x,player.z))*.006,.035,.16);
 const behind=new THREE.Vector3(
  player.x-Math.sin(player.yaw)*15,
  player.y+Math.max(5,Math.min(10,player.speed*.17)),
  player.z-Math.cos(player.yaw)*18);
 const look=new THREE.Vector3(player.x+Math.sin(player.yaw)*7,player.y+1.85,player.z+Math.cos(player.yaw)*19);
 const ease=1-Math.exp(-dt*3.4);
 camera.position.lerp(behind,ease);
 const target=new THREE.Vector3();camera.getWorldDirection(target);
 camera.lookAt(look);
 if(camera.position.y<heightAt(camera.position.x,camera.position.z)+2.3)camera.position.y=heightAt(camera.position.x,camera.position.z)+2.3;
}
function frame(time){
 if(paused||!started||over)return;
 const dt=Math.min(.045,(time-lastFrame)/1000||.016);lastFrame=time;
 try{
  updateInput(dt);animateAvatar(dt);animatePowder(dt);
  if(!player.airborne&&!activeRail&&Math.random()<.56)emitPowder();
  renderer.render(scene,camera);
  updateHud(time);
  if(time>toastUntil)$('trickToast').classList.remove('show');
  if(!paused&&!over)requestAnimationFrame(frame);
 }catch(err){
  console.error('Neon Freeski runtime issue',err);
  paused=true;screen.hidden=false;screen.querySelector('.panel>p').textContent='The 3D game encountered an error. Restart the run or reload the page.';
 }
}
function resize(){
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,innerWidth<620?1.3:1.7));
}
window.addEventListener('resize',resize);
document.addEventListener('keydown',e=>{
 const code=e.code;
 if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(code))e.preventDefault();
 if(code==='KeyP'||code==='Escape'){togglePause();return}
 if(code==='KeyR'){if(started){screen.hidden=true;paused=false;over=false;reset();lastFrame=performance.now();requestAnimationFrame(frame)}return}
 if((code==='Space'||code==='Enter')&&!started&&screen.hidden===false){startGame();return}
 keys.add(code);
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(started&&!paused&&!over)togglePause()});
$('pause').addEventListener('click',togglePause);
startBtn.addEventListener('click',()=>{if(paused&&started&&!over&&startBtn.textContent.includes('RESUME'))togglePause();else startGame()});
document.querySelectorAll('[data-park]').forEach(el=>el.addEventListener('click',()=>{
 document.querySelectorAll('[data-park]').forEach(b=>b.classList.toggle('active',b===el));
}));
document.querySelectorAll('[data-key]').forEach(btn=>{
 const code=btn.dataset.key;
 const down=e=>{e.preventDefault();btn.setPointerCapture?.(e.pointerId);keys.add(code);btn.classList.add('pressed')};
 const up=e=>{e.preventDefault();keys.delete(code);btn.classList.remove('pressed')};
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
});
window.__neonFreeskiDebug={
 get state(){return {started,paused,over,mode,score,best,...player,features:features.length,rails:rails.length,trees:settings[mode].trees}},
 start:startGame,reset,
 advance(seconds){for(let s=0;s<seconds;s+=.016)updateInput(.016)}
};
rebuildCourse();reset();
animateAvatar(.016);renderer.render(scene,camera);$('loading').hidden=true;
