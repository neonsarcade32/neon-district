(()=>{'use strict';const CONTROL_KEYS=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s',' ','Spacebar'];function releaseControls(){for(const key of CONTROL_KEYS){const code=key===' '?'Space':key.startsWith('Arrow')?key:'';const ev=new KeyboardEvent('keyup',{key,code,bubbles:true});document.dispatchEvent(ev);window.dispatchEvent(ev)}}function pauseSupported(){if(document.hidden){const b=document.getElementById('pause');if(b&&!b.disabled&&b.offsetParent!==null&&!/resume/i.test(b.textContent||'')){try{b.click()}catch(e){}}}}function ready(){document.documentElement.classList.add('nd-polish-ready');document.documentElement.classList.add('nd3-game-ui');const slug=location.pathname.split('/').pop().replace(/\.html$/,'');document.documentElement.dataset.nd3Game=slug;
const skins=['volt','ember','arctic'];let chosen='volt';
try{chosen=localStorage.getItem('nd3_skin')||'volt'}catch(e){}
document.documentElement.dataset.nd3Skin=skins.includes(chosen)?chosen:'volt';
const signatures={
 'snake':['#77efad','#dfff78'],'pong':['#80dcff','#fbffae'],'reaction':['#ffe07b','#ff8da3'],'breakout':['#ff9dc9','#fadb84'],
 'flappy':['#81e2ff','#ffe17c'],'traffic':['#ff9775','#a4c8ff'],'tetris':['#c4a2ff','#8ceef4'],'neon-dino':['#a8f67a','#65dfff'],
 'space':['#b4a4ff','#6aefff'],'hockey':['#8ed7ff','#bdfdff'],'breakaway':['#8bd7ff','#ffe589'],'drift':['#ff9488','#ffd575'],
 'ski':['#99e3ff','#f0faff'],'basketball':['#ffb277','#f1ec98'],'qb':['#ffc56f','#a7fbff'],'derby':['#ffb685','#dcff90'],
 'idle':['#ffda7b','#9ee7ff'],'tap':['#7ff0e9','#eab6ff'],'field-goal':['#95edc4','#ffeb9a'],'mini-golf':['#94f6a1','#dbff8f'],
 'turbo-slalom':['#ffae88','#83eff6'],'meteor-dodge':['#ffa2ad','#bbf7ff'],'stack-tower':['#ab99ff','#ffe6a2'],
 'penalty':['#89f1cf','#ffb3a2'],'circuit-hacker':['#8be8ff','#e1a3ff'],'beat-tiles':['#b298ff','#ff8fc5'],
 'claw-machine':['#ffa8d9','#8cedfa'],'color-dash':['#ffe173','#9bafff'],'free-throw':['#ffb77e','#fff3a4'],
 'goalkeeper':['#96edc4','#c4ffe9'],'highway':['#ff9e79','#83cbff'],'laser-defender':['#98afff','#fc9bbf'],
 'rooftop-run':['#9ad5ff','#ffc887']
};
if(chosen==='volt'&&signatures[slug]){
 const pair=signatures[slug];document.documentElement.style.setProperty('--nd3-accent',pair[0]);document.documentElement.style.setProperty('--nd3-accent2',pair[1])
}

const main=document.querySelector('main');
if(main&&!main.querySelector('.nd3-era-footer')){const foot=document.createElement('footer');foot.className='nd3-era-footer';foot.innerHTML='<span>NEON DISTRICT <b>3.0</b> / GAME STATION</span><a href="index.html">← RETURN TO THE ARCADE</a>';main.appendChild(foot)}
document.body?.setAttribute('data-nd-quality','3');const title=(document.querySelector('h1')?.textContent||document.title||'Neon District game').trim();document.querySelectorAll('a[href="index.html"]').forEach(a=>{if(/arcade 2\.0/i.test(a.textContent||''))a.textContent='← NEON DISTRICT 3.0'});const head=document.querySelector('.head')||document.querySelector('main h1');if(head&&!document.querySelector('.nd3-commandbar')){const bar=document.createElement('div');bar.className='nd3-commandbar';const brand=document.createElement('span');brand.textContent='NEON DISTRICT · 3.0';bar.appendChild(brand);if(document.fullscreenEnabled){const full=document.createElement('button');full.type='button';full.className='nd3-fullscreen';full.textContent='⛶ FULLSCREEN';full.setAttribute('aria-label','Toggle fullscreen for the game');full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await(document.querySelector('.stage')||document.querySelector('canvas')||document.documentElement).requestFullscreen()}catch(e){full.textContent='FULLSCREEN UNAVAILABLE'}};document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'⇲ EXIT FULLSCREEN':'⛶ FULLSCREEN'});bar.appendChild(full)}head.insertAdjacentElement('afterend',bar);
 const passportKey='nd3_arcade_passport',thisGame=location.pathname.split('/').pop();
 let passport={visited:[]};
 try{
  const saved=JSON.parse(localStorage.getItem(passportKey)||'null');
  if(saved&&Array.isArray(saved.visited))passport={visited:[...new Set(saved.visited.filter(x=>typeof x==='string'))]};
  if(thisGame&&thisGame.endsWith('.html')&&!passport.visited.includes(thisGame)){
   passport.visited.push(thisGame);
   localStorage.setItem(passportKey,JSON.stringify(passport))
  }
 }catch(_){}
 const count=passport.visited.length;
 const pass=document.createElement('button');pass.type='button';pass.className='nd3-passport';pass.textContent='🏅 PASSPORT '+count+'/35';pass.setAttribute('aria-label','View Neon District exploration passport');
 bar.appendChild(pass);
 const panel=document.createElement('div');panel.className='nd3-passport-panel';panel.hidden=true;
 const score=Math.min(35,count),tier=score>=35?'CITY LEGEND':score>=20?'ARCADE VETERAN':score>=10?'GAME HUNTER':score>=5?'EXPLORER':'ROOKIE';
 panel.innerHTML='<div class="nd3-passport-card"><h2>🏅 ARCADE PASSPORT</h2><p>'+score+' of 35 games explored on this device.</p><div class="nd3-passport-track"><i style="width:'+Math.round(score/35*100)+'%"></i></div><strong>'+tier+'</strong><p>Play more titles to explore the whole arcade. Your existing game saves and high scores are not changed.</p><button class="nd3-passport-close" type="button">CLOSE</button></div>';
 document.body.appendChild(panel);
 const showPass=()=>{panel.hidden=false;panel.querySelector('.nd3-passport-close')?.focus()};
 pass.onclick=showPass;
 panel.querySelector('.nd3-passport-close').onclick=()=>{panel.hidden=true;pass.focus()};
 panel.addEventListener('click',e=>{if(e.target===panel)panel.hidden=true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;pass.focus()}});
 const helpText=document.querySelector('.help')?.textContent?.trim();
 if(helpText){
  const help=document.createElement('button');help.type='button';help.className='nd3-help';help.textContent='? CONTROLS';help.setAttribute('aria-label','View game controls');
  help.title=helpText;
  help.onclick=()=>{const existing=document.querySelector('.nd3-control-tip');if(existing){existing.remove();return}const tip=document.createElement('div');tip.className='nd3-control-tip';tip.setAttribute('role','status');tip.textContent=helpText;document.body.appendChild(tip);setTimeout(()=>tip.remove(),6500)};
  bar.appendChild(help)
 }
 const targetCanvas=document.querySelector('canvas');
 if(targetCanvas){
  const shot=document.createElement('button');shot.type='button';shot.className='nd3-snapshot';shot.textContent='📸 SNAPSHOT';shot.setAttribute('aria-label','Save a screenshot of the game canvas');
  shot.onclick=()=>{try{const a=document.createElement('a');a.download='neon-district-'+thisGame.replace('.html','')+'-screenshot.png';a.href=targetCanvas.toDataURL('image/png');a.click()}catch(e){shot.textContent='CAPTURE UNAVAILABLE';setTimeout(()=>shot.textContent='📸 SNAPSHOT',2000)}};
  bar.appendChild(shot)
 }
}document.querySelectorAll('button').forEach(b=>{if(!b.getAttribute('aria-label')&&(b.textContent||'').trim())b.setAttribute('aria-label',(b.textContent||'').trim())});document.querySelectorAll('canvas').forEach(cv=>{cv.setAttribute('role','img');if(!cv.getAttribute('aria-label'))cv.setAttribute('aria-label',title+' game area');cv.addEventListener('contextmenu',e=>e.preventDefault())})}window.addEventListener('blur',releaseControls);window.addEventListener('pagehide',releaseControls);document.addEventListener('visibilitychange',()=>{releaseControls();pauseSupported()});window.addEventListener('pointercancel',releaseControls,true);window.addEventListener('error',()=>{if(document.querySelector('.nd-error-toast'))return;const el=document.createElement('div');el.className='nd-error-toast';el.textContent='Game error detected — reload this game if controls stop responding.';document.body?.appendChild(el);setTimeout(()=>el.remove(),3200)});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready()
function stage(){return document.querySelector('.stage')||document.querySelector('canvas')?.parentElement||document.body}
function pop(el){if(!el)return;el.classList.remove('nd-pop');void el.offsetWidth;el.classList.add('nd-pop');setTimeout(()=>el.classList.remove('nd-pop'),280)}
function shake(){const el=stage();if(!el)return;el.classList.remove('nd-shake');void el.offsetWidth;el.classList.add('nd-shake');setTimeout(()=>el.classList.remove('nd-shake'),300)}
function flash(){const el=stage();if(!el)return;el.classList.remove('nd-flash');void el.offsetWidth;el.classList.add('nd-flash');setTimeout(()=>el.classList.remove('nd-flash'),220)}
window.NDPolish={pop,shake,flash};
document.addEventListener('pointerdown',e=>{const b=e.target.closest?.('button');if(b)b.classList.add('nd-pressed');const st=e.target.closest?.('.stage');if(st)st.classList.add('nd-stage-active')},true);
for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,()=>{document.querySelectorAll('.nd-pressed').forEach(x=>x.classList.remove('nd-pressed'));document.querySelectorAll('.nd-stage-active').forEach(x=>x.classList.remove('nd-stage-active'))},true);
document.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&e.target?.tagName==='BUTTON')e.target.classList.add('nd-pressed')},true);
document.addEventListener('keyup',()=>document.querySelectorAll('.nd-pressed').forEach(x=>x.classList.remove('nd-pressed')),true);
const mo=new MutationObserver(ms=>{for(const m of ms){const el=m.target.nodeType===3?m.target.parentElement:m.target;if(el?.matches?.('.hud strong,.box strong,#score'))pop(el)}});if(document.body)mo.observe(document.body,{subtree:true,childList:true,characterData:true});
})();