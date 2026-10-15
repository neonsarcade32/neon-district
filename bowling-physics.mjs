// Neon Bowling 3.1 — deterministic, fixed-step, collision-driven pin simulation.
// World units follow Three.js lane: the ball starts at z=10.9 and pins sit at z=-12.3..-14.1.
// No hidden strike targets, pin carry budgets or forced knockdowns.
export const PIN_LAYOUT=Object.freeze([
 [0,-12.3],[-.55,-12.9],[.55,-12.9],[-1.1,-13.5],[0,-13.5],[1.1,-13.5],
 [-1.65,-14.1],[-.55,-14.1],[.55,-14.1],[1.65,-14.1]
]);
export const BALL_RADIUS=.42,PIN_RADIUS=.245,STEP=1/120;
export const BALL_PRESETS=Object.freeze({control:{speed:.94,curve:1.22,transfer:.9},pro:{speed:1,curve:1,transfer:1},power:{speed:.96,curve:.79,transfer:1.12}});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const damp=(v,k,dt)=>v*Math.exp(-k*dt);
export function createRack(mask=Array(10).fill(true)){
 return PIN_LAYOUT.map(([x,z],i)=>({
  id:i,x,z,x0:x,z0:z,active:mask[i]!==false,fallen:false,vy:0,y:.1,
  vx:0,vz:0,tip:0,tipX:0,tipZ:0,wobble:0,impact:0,contacts:0,
 }));
}
export function createShot({x=0,aim=0,hook=0,power=.65,oil=0,ballType='pro'}={}){
 const preset=BALL_PRESETS[ballType]||BALL_PRESETS.pro;
 const speed=(14.5+clamp(power,0,1)*7.3)*preset.speed,angle=clamp(aim,-1,1)*.19;
 return {x:clamp(x,-2.35,2.35),z:10.9,y:.52,
  vx:Math.sin(angle)*speed,vz:-Math.cos(angle)*speed,
  spin:clamp(hook,-1,1)*preset.curve,oil:clamp(oil,-.14,.14),ballType,transfer:preset.transfer,
  power:clamp(power,0,1),speed,t:0,travel:0,gutter:false,finished:false,
  contactCount:0,hitIds:new Set(),maxSpeed:0
 };
}
function impulsePin(p,speed,nx,nz,events,source){
 if(!p.active||speed<.10)return;
 // A glancing touch can wobble a pin without counting it as down.
 p.impact=Math.max(p.impact,speed);
 p.wobble=Math.max(p.wobble,Math.min(.33,speed*.045));
 p.vx+=nx*speed*.50;p.vz+=nz*speed*.50;
 const v=Math.hypot(p.vx,p.vz);
 if(v>8.5){p.vx*=8.5/v;p.vz*=8.5/v}
 if(!p.fallen&&(speed>.82||v>1.2)){
  p.fallen=true;p.tip=.01;
  p.vy=Math.min(.6,speed*.09);
  p.tipX=clamp(-p.vz/Math.max(.2,Math.hypot(p.vx,p.vz)),-1,1);
  p.tipZ=clamp(p.vx/Math.max(.2,Math.hypot(p.vx,p.vz)),-1,1);
  events.push({type:'pin-down',id:p.id,source})
 }else if(p.fallen){
  p.tipX=.8*p.tipX-.2*nz;
  p.tipZ=.8*p.tipZ+.2*nx;
 }
 p.contacts++;
}
export function stepPhysics(shot,pins,dt=STEP){
 const events=[];
 if(shot.finished&&!pins.some(p=>p.active&&p.fallen&&Math.hypot(p.vx,p.vz)>.025))return events;
 dt=clamp(dt,0,1/30);
 shot.t+=dt;
 if(!shot.finished&&shot.z>-17.2){
  const travelled=clamp((10.9-shot.z)/25.4,0,1);
  const friction=.135 + travelled*.055; // oil transitions to dry boards toward the pins
  const hookForce=shot.spin*(.85+travelled*2.8)+shot.oil*.65;
  shot.vx=(shot.vx+hookForce*dt)*Math.exp(-friction*.36*dt);
  shot.vz=damp(shot.vz,friction*.23,dt);
  const oldX=shot.x,oldZ=shot.z;
  shot.x+=shot.vx*dt;shot.z+=shot.vz*dt;
  shot.travel+=Math.hypot(shot.x-oldX,shot.z-oldZ);
  if(!shot.gutter&&Math.abs(shot.x)>2.73){
   shot.gutter=true;shot.y=.18;events.push({type:'gutter'})
  }
  if(!shot.gutter){
   shot.y=.52;
   for(const pin of pins){
    if(!pin.active)continue;
    const dx=pin.x-shot.x,dz=pin.z-shot.z;
    const distance=Math.hypot(dx,dz),min=BALL_RADIUS+PIN_RADIUS;
    if(distance>=min)continue;
    const safe=Math.max(distance,1e-5),nx=dx/safe,nz=dz/safe;
    const normalSpeed=(shot.vx-pin.vx)*nx+(shot.vz-pin.vz)*nz;
    if(normalSpeed<=.05)continue;
    // Ball ~7x the mass of a pin; collision uses speed and incidence angle.
    const transfer=normalSpeed*(.95+shot.power*.12)*shot.transfer;
    impulsePin(pin,transfer,nx,nz,events,'ball');
    const impulse=transfer*.10;
    shot.vx-=nx*impulse;shot.vz-=nz*impulse;
    const overlap=min-distance;
    pin.x+=nx*overlap*.72;pin.z+=nz*overlap*.72;
    shot.x-=nx*overlap*.28;shot.z-=nz*overlap*.28;
    if(!shot.hitIds.has(pin.id)){shot.hitIds.add(pin.id);shot.contactCount++;events.push({type:'ball-pin',id:pin.id})}
   }
  }
 }
 // Pins move in real lane coordinates and knock each other over upon contact.
 for(const p of pins){
  if(!p.active)continue;
  if(p.fallen){
   p.x+=p.vx*dt;p.z+=p.vz*dt;
   p.vx=damp(p.vx,2.35,dt);p.vz=damp(p.vz,2.35,dt);
   const speed=Math.hypot(p.vx,p.vz);
   p.tip=Math.min(1.38,p.tip+dt*(2.8+Math.min(speed*.3,2.2)));
   p.y+=p.vy*dt;p.vy-=7*dt;
   if(p.y<.1){p.y=.1;if(p.vy<-.75){p.vy=-p.vy*.16}else p.vy=0}
   p.x=clamp(p.x,-3.54,3.54);p.z=clamp(p.z,-16.7,-10.9)
  }else{
   p.vx=damp(p.vx,15,dt);p.vz=damp(p.vz,15,dt);
   // Upright pins rock back rather than automatically falling on any touch.
   p.wobble=damp(p.wobble,3.3,dt);
  }
 }
 for(let i=0;i<pins.length;i++)for(let j=i+1;j<pins.length;j++){
  const a=pins[i],b=pins[j];if(!a.active||!b.active||(!a.fallen&&!b.fallen))continue;
  const dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz);
  const reach=.52;
  if(dist<.0001||dist>=reach)continue;
  const nx=dx/dist,nz=dz/dist;
  // Transfer momentum along the collision normal, not based on a desired score.
  const closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;
  if(closing>.1){
   const exchange=closing*.83;
   impulsePin(a,exchange,-nx,-nz,events,'pin');
   impulsePin(b,exchange,nx,nz,events,'pin');
   a.vx-=nx*exchange*.22;a.vz-=nz*exchange*.22;
   b.vx+=nx*exchange*.22;b.vz+=nz*exchange*.22;
   if(exchange>.9)events.push({type:'pin-pin',a:a.id,b:b.id})
  }
  const overlap=reach-dist;
  const share=a.fallen&&b.fallen?.5:a.fallen?.13:.87;
  a.x-=nx*overlap*share;a.z-=nz*overlap*share;
  b.x+=nx*overlap*(1-share);b.z+=nz*overlap*(1-share)
 }
 if(!shot.finished&&(shot.z<=-17.2||shot.t>4.2)){shot.finished=true;events.push({type:'ball-finished'})}
 return events;
}
export function knockedCount(pins){return pins.reduce((n,p)=>n+(p.active&&p.fallen?1:0),0)}
export function movingEnergy(pins){return pins.reduce((n,p)=>n+(p.active&&p.fallen?Math.hypot(p.vx,p.vz):0),0)}
export function simulateShot(args={},mask=Array(10).fill(true),maxTime=6){
 const shot=createShot(args),pins=createRack(mask),events=[];
 const n=Math.ceil(maxTime/STEP);
 for(let i=0;i<n;i++){events.push(...stepPhysics(shot,pins,STEP));if(shot.finished&&movingEnergy(pins)<.2)break}
 return {shot,pins,events,down:knockedCount(pins),gutter:shot.gutter};
}
