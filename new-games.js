'use strict';
const kind=document.body.dataset.game,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id),W=400,H=540,keys={};
let mode='ready',score=0,state={},last=0,elapsed=0,best=+(localStorage.getItem('hs_'+kind)||0),variant=document.body.dataset.variant||'normal';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function clearKeys(){for(const k of Object.keys(keys))keys[k]=false}
function breakoutBricks(level){const rows=Math.min(7,4+level);return Array.from({length:rows*6},(_,i)=>({x:15+(i%6)*63,y:48+Math.floor(i/6)*26,w:55,h:17,alive:true}))}
function hud(){
 if(kind==='breakout')$('score').textContent='Score: '+score+' · Best: '+best+' · Lives: '+state.lives+' · Level: '+state.level+(state.powerTimer>0?' · '+state.power.toUpperCase()+' POWER':'');
 else if(kind==='space')$('score').textContent='Score: '+score+' · Best: '+best+' · HP: '+state.hp+' · Wave: '+state.wave+(state.rapidTimer>0?' · ⚡ RAPID':'')+(state.shieldTimer>0?' · 🛡 SHIELD':'');
 else $('score').textContent='Score: '+score+' · Best: '+best;
 if($('variantLabel'))$('variantLabel').textContent=variant.toUpperCase();
}
function reset(){
 score=0;elapsed=0;clearKeys();
 if(kind==='breakout')state={x:155,bx:200,by:440,vx:145,vy:-245,lives:3,level:1,bricks:breakoutBricks(1),pickups:[],power:'',powerTimer:0};
 if(kind==='flappy')state={y:250,vy:0,pipes:[],spawn:.8,rings:[],ringHits:0};
 if(kind==='space')state={x:180,bullets:[],enemies:[],shots:[],spawn:.6,cool:0,hp:3,wave:1,inv:0,pickups:[],shieldTimer:0,rapidTimer:0,bossWave:0};
 hud();draw();
}
function start(){reset();mode='playing';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Pause';last=performance.now()}
function finish(won=false){
 mode='over';clearKeys();won?window.NDPolish?.flash():window.NDPolish?.shake();if(score>best){best=score;localStorage.setItem('hs_'+kind,best)}
 $('overlay').hidden=false;$('message').textContent=won?'You cleared the run!':'Game over';$('detail').textContent='Final score: '+score+' · Best: '+best;$('start').textContent='Play again';$('pause').disabled=true;hud()
}
function pause(){if(!['playing','paused'].includes(mode))return;mode=mode==='playing'?'paused':'playing';clearKeys();$('pause').textContent=mode==='paused'?'Resume':'Pause';$('overlay').hidden=mode!=='paused';if(mode==='paused'){$('message').textContent='Paused';$('detail').textContent='Ready when you are.';$('start').textContent='Resume'}last=performance.now()}
function flap(){if(mode==='playing'&&kind==='flappy')state.vy=variant==='chill'?-260:-290}
function update(dt){
 elapsed+=dt;const s=state,move=(keys.right?1:0)-(keys.left?1:0);
 if(kind==='breakout'){
  const paddleW=s.powerTimer>0&&s.power==='wide'?140:90;s.powerTimer=Math.max(0,s.powerTimer-dt);s.x=clamp(s.x+move*360*dt,0,W-paddleW);const oldY=s.by;s.bx+=s.vx*dt;s.by+=s.vy*dt;
  if(s.bx<8||s.bx>392){s.bx=clamp(s.bx,8,392);s.vx*=-1}if(s.by<8){s.by=8;s.vy=Math.abs(s.vy)}
  if(s.vy>0&&oldY+8<=490&&s.by+8>=490&&s.bx+8>=s.x&&s.bx-8<=s.x+paddleW){s.by=482;const angle=(s.bx-(s.x+paddleW/2))/(paddleW/2);s.vx=angle*(235+s.level*9);s.vy=-Math.sqrt(Math.max(26000,(325+s.level*12)*(325+s.level*12)-s.vx*s.vx))}
  for(const b of s.bricks)if(b.alive&&hit({x:s.bx-8,y:s.by-8,w:16,h:16},b)){b.alive=false;score+=10*s.level;if(Math.random()<.14)s.pickups.push({x:b.x+b.w/2,y:b.y+b.h,type:['wide','slow','life'][Math.floor(Math.random()*3)]});if(oldY+8<=b.y||oldY-8>=b.y+b.h)s.vy*=-1;else s.vx*=-1;break}
  for(const p of s.pickups){p.y+=110*dt;if(Math.abs(p.y-490)<18&&p.x>=s.x-9&&p.x<=s.x+paddleW+9){p.dead=true;score+=35;if(p.type==='life')s.lives=Math.min(6,s.lives+1);else{s.power=p.type;s.powerTimer=11;if(p.type==='slow'){s.vx*=.73;s.vy*=.73}}window.NDPolish?.flash()}}
  s.pickups=s.pickups.filter(p=>!p.dead&&p.y<H+20);
  if(s.bricks.every(b=>!b.alive)){if(s.level>=5){finish(true);return}window.NDPolish?.flash();s.level++;score+=100;s.bricks=breakoutBricks(s.level);s.bx=s.x+paddleW/2;s.by=440;s.vx=155+s.level*12;s.vy=-(250+s.level*15);hud()}
  if(s.by>550){window.NDPolish?.shake();if(--s.lives===0){finish();return}s.bx=s.x+paddleW/2;s.by=440;s.vx=145+s.level*8;s.vy=-(245+s.level*12)}
 }
 if(kind==='flappy'){
  const cfg=variant==='chill'?{speed:140,gap:185,grav:680}:variant==='pro'?{speed:195,gap:138,grav:820}:{speed:165,gap:160,grav:760};
  s.vy+=cfg.grav*dt;s.y+=s.vy*dt;s.spawn-=dt;if(s.spawn<=0){s.pipes.push({x:420,gap:92+Math.random()*240,passed:false});if(Math.random()<.54){const pipe=s.pipes.at(-1);s.rings.push({x:pipe.x+28,y:pipe.gap+cfg.gap/2,dead:false})}s.spawn=variant==='pro'?1.35:1.65}
  for(const p of s.pipes){p.x-=cfg.speed*dt;if(!p.passed&&p.x+60<88){p.passed=true;score++}if(100+12>p.x&&100-12<p.x+60&&(s.y-12<p.gap||s.y+12>p.gap+cfg.gap)){finish();return}}
  for(const ring of s.rings){ring.x-=cfg.speed*dt;if(!ring.dead&&Math.hypot(100-ring.x,s.y-ring.y)<29){ring.dead=true;score+=3;s.ringHits++;window.NDPolish?.flash()}}
  s.rings=s.rings.filter(r=>!r.dead&&r.x>-45);
  s.pipes=s.pipes.filter(p=>p.x>-70);if(s.y<12||s.y>H-12){finish();return}
 }
 if(kind==='space'){
  s.wave=1+Math.floor(elapsed/18);s.inv=Math.max(0,s.inv-dt);s.shieldTimer=Math.max(0,s.shieldTimer-dt);s.rapidTimer=Math.max(0,s.rapidTimer-dt);
  if(s.wave%3===0&&s.wave>s.bossWave&&!s.enemies.some(e=>e.boss)){s.enemies.push({x:125,y:-75,w:150,h:65,fire:.55,hp:11+s.wave*2,boss:true});s.bossWave=s.wave;window.NDPolish?.flash()}
  for(const pickup of s.pickups){pickup.y+=120*dt;if(!pickup.dead&&hit({x:pickup.x,y:pickup.y,w:22,h:22},{x:s.x,y:460,w:36,h:32})){pickup.dead=true;if(pickup.type==='heal')s.hp=Math.min(5,s.hp+1);if(pickup.type==='rapid')s.rapidTimer=9;if(pickup.type==='shield')s.shieldTimer=6;window.NDPolish?.flash()}}
  s.pickups=s.pickups.filter(p=>!p.dead&&p.y<H+35);s.x=clamp(s.x+move*315*dt,12,352);s.cool-=dt;if(keys.fire&&s.cool<=0){s.bullets.push({x:s.x+15,y:460,w:6,h:16});s.cool=s.rapidTimer>0?.07:variant==='rapid'?.11:.18}
  const spawnBase=variant==='survival'?.52:.72;s.spawn-=dt;if(s.spawn<=0){s.enemies.push({x:20+Math.random()*322,y:-40,w:38,h:30,fire:.8+Math.random()*1.2,hp:1+(s.wave>4&&Math.random()<.3?1:0),boss:false});s.spawn=Math.max(.24,spawnBase-s.wave*.035)}
  for(const b of s.bullets)b.y-=500*dt;
  for(const e of s.enemies){e.y+=(e.boss?12:55+s.wave*8)*dt;e.fire-=dt;if(e.fire<=0){s.shots.push({x:e.x+(e.boss?e.w/2:16),y:e.y+30,w:6,h:12});e.fire=e.boss?.55:Math.max(.65,2-s.wave*.08)}for(const b of s.bullets)if(!b.dead&&!e.dead&&hit(b,e)){b.dead=true;e.hp--;if(e.hp<=0){e.dead=true;score+=(e.boss?320:10+s.wave*2);if(Math.random()<(e.boss?1:.11))s.pickups.push({x:e.x+e.w/2,y:e.y,type:['heal','rapid','shield'][Math.floor(Math.random()*3)]})}}if(!e.dead&&(e.y>H||hit(e,{x:s.x,y:460,w:36,h:32}))&&s.inv<=0){e.dead=true;if(s.shieldTimer<=0)s.hp--;s.inv=1.1;window.NDPolish?.shake();if(s.hp<=0){finish();return}}}
  for(const b of s.shots){b.y+=(235+s.wave*8)*dt;if(!b.dead&&s.inv<=0&&hit(b,{x:s.x,y:460,w:36,h:32})){b.dead=true;if(s.shieldTimer<=0)s.hp--;s.inv=1.1;window.NDPolish?.shake();if(s.hp<=0){finish();return}}}
  s.bullets=s.bullets.filter(b=>!b.dead&&b.y>-20);s.enemies=s.enemies.filter(e=>!e.dead);s.shots=s.shots.filter(b=>!b.dead&&b.y<H);
 }
 hud();
}
function car(x,y,color){rect(x,y,48,72,color);rect(x+8,y+12,32,17,'#b8eaff');rect(x+8,y+46,32,12,'#17264a')}
// Neon District 3.0: new illustrated gameplay visuals for core canvas titles.
const nd3Stars=Array.from({length:66},(_,i)=>({x:(i*71+49)%W,y:(i*137+11)%H,r:(i%4)/2+.7,depth:i%3+1}));
const nd3Gradients={};
function nd3Gradient(which,from,to){
 if(nd3Gradients[which])return nd3Gradients[which];
 const g=ctx.createLinearGradient(0,0,100,H);g.addColorStop(0,from);g.addColorStop(1,to);return nd3Gradients[which]=g
}
function nd3SoftOrb(x,y,r,col,alpha=.4){const g=ctx.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()}
function nd3SpriteBox(x,y,w,h,col){
 ctx.save();ctx.fillStyle='#040d1b';ctx.globalAlpha=.4;ctx.fillRect(x+4,y+5,w,h);
 ctx.globalAlpha=1;ctx.fillStyle=col;ctx.fillRect(x,y,w,h);
 ctx.fillStyle='#ffffff55';ctx.fillRect(x+3,y+3,w-6,3);
 ctx.fillStyle='#020a1922';ctx.fillRect(x+3,y+h-5,w-6,3);
 ctx.restore()
}
function nd3Backdrop(){
 if(kind==='breakout'){
  ctx.fillStyle=nd3Gradient('brick','#171336','#080e20');ctx.fillRect(0,0,W,H);
  nd3SoftOrb(285,115,230,'#8e5fff',.28);
  for(let i=0;i<8;i++)rect(0,66*i,W,1,'#ffffff09');
  for(let i=0;i<11;i++)rect(38*i,0,1,H,'#89a5ff09');
  rect(8,9,4,H-18,'#314b69');rect(W-12,9,4,H-18,'#314b69');
  ctx.fillStyle='#9cf9ff';ctx.font='bold 12px system-ui';ctx.fillText('NEON / BREAKOUT',19,528)
 }else if(kind==='flappy'){
  ctx.fillStyle=nd3Gradient('sky','#132654','#1c7687');ctx.fillRect(0,0,W,H);
  nd3SoftOrb(320,105,130,'#ffc47f',.52);circle(319,104,42,'#ffdca8');
  ctx.save();ctx.globalAlpha=.3;
  for(let i=0;i<8;i++){const xx=((i*86-elapsed*16)%480+480)%480-40;circle(xx,75+i%3*48,21,'#f0faff')}
  ctx.restore();
  for(let i=0;i<16;i++){let x=i*33-(elapsed*24%33),h=55+(i%5)*13;
   rect(x,406-h,29,h,'#12394b');for(let k=0;k<3;k++)rect(x+6+k*6,416-h,3,6,'#6db5c87d')
  }
  rect(0,416,W,124,'#0b3c4c');rect(0,415,W,3,'#89e9df');
  for(let i=0;i<13;i++){rect(i*39,430+(i%3)*12,22,3,'#84dfff40')}
 }else if(kind==='space'){
  ctx.fillStyle=nd3Gradient('space','#080d28','#201943');ctx.fillRect(0,0,W,H);
  nd3SoftOrb(95,105,158,'#7262ff',.23);nd3SoftOrb(319,320,160,'#16d7eb',.19);
  for(const star of nd3Stars){const y=(star.y+elapsed*(15+star.depth*12))%H;circle(star.x,y,star.r,'#c7eaff')}
  ctx.strokeStyle='#5caaff17';ctx.lineWidth=1;for(let i=1;i<10;i++){let y=i*54;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 }
}
function draw(){
 nd3Backdrop();const s=state;
 if(kind==='breakout'){
  for(const p of s.pickups){nd3SoftOrb(p.x,p.y,35,p.type==='life'?'#74ffac':'#be9dff',.34);circle(p.x,p.y,12,p.type==='life'?'#80ffc5':p.type==='wide'?'#bea3ff':'#79eaff');ctx.fillStyle='#122336';ctx.font='bold 13px system-ui';ctx.fillText(p.type==='life'?'+':p.type==='wide'?'↔':'S',p.x-6,p.y+5)}
  const color=['#ff658e','#ffab61','#fff186','#73ffc3','#6ad5ff','#b69cff','#ff7cc8'];
  for(let i=0;i<s.bricks.length;i++){const b=s.bricks[i];if(!b.alive)continue;
   nd3SpriteBox(b.x,b.y,b.w,b.h,color[Math.floor(i/6)%7])
  }
  const w=s.powerTimer>0&&s.power==='wide'?140:90;
  nd3SoftOrb(s.x+w/2,488,w,'#5bffff',.4);
  nd3SpriteBox(s.x,490,w,12,s.powerTimer>0?'#79ffea':'#d7fcff');
  nd3SoftOrb(s.bx,s.by,32,'#ffe06d',.44);circle(s.bx,s.by,9,'#fff5c7');circle(s.bx-3,s.by-3,3,'#ffffff');
  rect(0,H-2,W,2,'#51ceff')
 }
 if(kind==='flappy'){
  const cfg=variant==='chill'?185:variant==='pro'?138:160;
  for(const p of s.pipes){
   nd3SpriteBox(p.x,0,60,p.gap,'#21b89e');nd3SpriteBox(p.x,p.gap+cfg,60,H-p.gap-cfg,'#21b89e');
   nd3SpriteBox(p.x-5,p.gap-17,70,17,'#6ff9c0');nd3SpriteBox(p.x-5,p.gap+cfg,70,17,'#6ff9c0');
   rect(p.x+8,0,5,p.gap,'#c9fff780');rect(p.x+8,p.gap+cfg,5,H-p.gap-cfg,'#c9fff780')
  }
  for(const ring of s.rings){nd3SoftOrb(ring.x,ring.y,45,'#ffe87d',.4);ctx.strokeStyle='#ffed91';ctx.lineWidth=6;ctx.beginPath();ctx.arc(ring.x,ring.y,18,0,Math.PI*2);ctx.stroke()}
  nd3SoftOrb(98,s.y,44,'#ffe47b',.35);
  circle(100,s.y,16,'#ffe987');ctx.fillStyle='#f7a05b';ctx.beginPath();ctx.moveTo(110,s.y);ctx.lineTo(129,s.y+3);ctx.lineTo(110,s.y+9);ctx.closePath();ctx.fill();
  circle(107,s.y-7,5,'#14233b');circle(108,s.y-8,2,'#f4fcff');
  ctx.fillStyle='#fcfbef';ctx.beginPath();ctx.ellipse(94,s.y+4,9,6,.28,0,Math.PI*2);ctx.fill()
 }
 if(kind==='space'){
  ctx.save();ctx.globalAlpha=s.inv>0&&Math.floor(elapsed*12)%2?.25:1;
  nd3SoftOrb(s.x+19,480,44,'#69e7ff',.35);
  ctx.fillStyle='#6ce5ff';ctx.beginPath();ctx.moveTo(s.x+18,448);ctx.lineTo(s.x-5,493);ctx.lineTo(s.x+11,484);ctx.lineTo(s.x+18,497);ctx.lineTo(s.x+25,484);ctx.lineTo(s.x+41,493);ctx.closePath();ctx.fill();
  ctx.fillStyle='#edfdff';ctx.beginPath();ctx.moveTo(s.x+18,456);ctx.lineTo(s.x+9,478);ctx.lineTo(s.x+27,478);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffa867';ctx.beginPath();ctx.moveTo(s.x+14,493);ctx.lineTo(s.x+18,510+Math.sin(elapsed*23)*6);ctx.lineTo(s.x+22,493);ctx.fill();
  if(s.shieldTimer>0){ctx.strokeStyle='#85e5ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x+18,473,33,0,Math.PI*2);ctx.stroke()}
  ctx.restore();
  for(const bullet of s.bullets){nd3SpriteBox(bullet.x,bullet.y,bullet.w,bullet.h,'#efff96')}
  for(const bullet of s.shots){nd3SpriteBox(bullet.x,bullet.y,bullet.w,bullet.h,'#ff8b9f')}
  for(const p of s.pickups){nd3SoftOrb(p.x+11,p.y+11,35,'#7cf4ff',.28);circle(p.x+11,p.y+11,12,p.type==='heal'?'#88eaaa':p.type==='rapid'?'#ffdb84':'#8dcaff')}
  for(const e of s.enemies){
   const color=e.boss?'#ff658e':e.hp>1?'#f38ad1':'#b99dff';
   nd3SoftOrb(e.x+e.w/2,e.y+e.h/2,e.boss?96:31,color,.16);nd3SpriteBox(e.x,e.y,e.w,e.h,color);
   if(e.boss){rect(e.x,e.y-11,e.w,6,'#24364b');rect(e.x,e.y-11,e.w*Math.max(0,e.hp/(11+s.wave*2)),6,'#dfff82');for(let i=0;i<4;i++)rect(e.x+13+i*36,e.y+13,16,6,'#07142e')}
   else{rect(e.x+7,e.y+9,6,6,'#16223e');rect(e.x+25,e.y+9,6,6,'#16223e')}
  }
 }
}

function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(mode==='playing'){let remaining=dt;while(remaining>0&&mode==='playing'){const step=Math.min(remaining,1/120);update(step);remaining-=step}}draw();requestAnimationFrame(frame)}
$('start').onclick=()=>mode==='paused'?pause():start();$('restart').onclick=start;$('pause').onclick=pause;
function bindHold(id,key){const b=$(id);if(!b)return;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[key]=true});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys[key]=false)}
bindHold('left','left');bindHold('right','right');bindHold('fire','fire');if($('flap'))$('flap').onclick=flap;
document.querySelectorAll('[data-variant]').forEach(b=>b.onclick=()=>{if(mode==='playing')return;variant=b.dataset.variant;document.body.dataset.variant=variant;document.querySelectorAll('[data-variant]').forEach(q=>q.classList.toggle('active',q===b));reset()});
document.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON')return;const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup',' ','a','d','p'].includes(k))e.preventDefault();if(k==='p'&&!e.repeat)pause();if(k==='a'||k==='arrowleft')keys.left=true;if(k==='d'||k==='arrowright')keys.right=true;if(k===' '||k==='arrowup'){keys.fire=true;if(!e.repeat)flap()}});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='a'||k==='arrowleft')keys.left=false;if(k==='d'||k==='arrowright')keys.right=false;if(k===' '||k==='arrowup')keys.fire=false});
function point(e){if(mode!=='playing')return;if(kind==='breakout'){const r=canvas.getBoundingClientRect();state.x=clamp((e.clientX-r.left)*W/r.width-(state.powerTimer>0&&state.power==='wide'?70:45),0,(state.powerTimer>0&&state.power==='wide'?260:310))}}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);point(e);flap()});canvas.addEventListener('pointermove',e=>{if(e.buttons)point(e)});
window.addEventListener('blur',()=>{clearKeys();if(mode==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});
reset();requestAnimationFrame(frame);