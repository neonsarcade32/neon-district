'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.ARCADE_TEST_URL||'http://127.0.0.1:8080';
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const games=[...src.matchAll(/\bid:'([^']+)',name:'([^']+)',file:'([^']+)',cat:'([^']+)'/g)].map(m=>({id:m[1],name:m[2],file:m[3]}));
const output=path.join(__dirname,'screenshots');
fs.mkdirSync(output,{recursive:true});
const failures=[],successes=[];
function check(name,ok){if(ok)successes.push(name);else failures.push(name)}
async function pageTo(browser,file,viewport){
 const p=await browser.newPage({viewport:viewport||{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
 const errors=[];p.on('pageerror',err=>errors.push(err.message));
 const response=await p.goto(base+'/'+file,{waitUntil:'networkidle',timeout:40000}).catch(async()=>p.goto(base+'/'+file,{waitUntil:'domcontentloaded',timeout:40000}));
 return {p,errors,status:response?.status()}
}
async function horizontalOverflow(p){return p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+12)}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-gpu','--use-gl=swiftshader']});
 try{
  const {p,errors,status}=await pageTo(browser,'index.html');
  check('Homepage loads',status===200);
  check('All 35 game cards appear',await p.locator('.gameCard').count()===35);
  check('All 35 have custom vector artwork',await p.locator('.gameCard .nd3-illustration').count()===35);
  check('Game cards use accessible links',await p.locator('.gameCard .gameLink').count()===35);
  check('Hero has real vector artwork',await p.locator('#nd3HeroArt svg').count()===1);
  check('Featured cards have game art',await p.locator('.miniFeature svg').count()===3);
  check('Actual redesigned skin loaded',await p.locator('body.nd3-home').count()===1&&await p.locator('link[href*="nd3-home.css"]').count()===1);
  check('Homepage has no runtime error',errors.length===0);
  check('Desktop has no unexpected horizontal overflow',!(await horizontalOverflow(p)));
  await p.screenshot({path:path.join(output,'homepage-desktop.png'),fullPage:true});
  await p.locator('[data-theme="ember"]').click();
  check('Theme switch updates document',await p.evaluate(()=>document.documentElement.dataset.nd3Skin==='ember'));
  check('Theme selection persists',await p.evaluate(()=>localStorage.getItem('nd3_skin')==='ember'));
  await p.locator('[data-theme="volt"]').click();
  const link=p.locator('.gameCard[data-id="snake"] .gameLink');
  check('Snake launch link resolves',await link.getAttribute('href')==='snake.html');
  await p.locator('.gameCard[data-id="snake"] .fav').click();
  check('Favoriting does not navigate',new URL(p.url()).pathname.endsWith('/index.html'));
  check('Favorite button works',await p.locator('.gameCard[data-id="snake"] .fav.on').count()===1);
  await p.close();

  const mobile=await pageTo(browser,'index.html',{width:390,height:844});
  check('Mobile homepage loads',mobile.status===200);
  check('Mobile homepage not horizontally clipped',!(await horizontalOverflow(mobile.p)));
  check('Mobile all 35 game cards accessible',await mobile.p.locator('.gameCard').count()===35);
  await mobile.p.screenshot({path:path.join(output,'homepage-mobile.png'),fullPage:true});
  await mobile.p.close();
  for(const g of games){
    const full=['city','bowling'].includes(g.id);
    const {p,errors,status}=await pageTo(browser,g.file,{width:1080,height:800});
    check(g.name+' opens',status===200);
    if(full)check(g.name+' flagship visual skin',await p.locator('link[href*="nd3-flagships.css"]').count()===1);
    else {
      check(g.name+' unified 3.0 presentation',await p.locator('html.nd3-game-ui').count()===1);
      check(g.name+' new visual CSS variables',await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--nd3-accent').trim().length>0));
      check(g.name+' stage loads',await p.locator('canvas,.arena,.stage,.app .city').count()>0);
    }
    check(g.name+' no JS startup error',errors.length===0);
    if(['city','bowling','snake','hockey','tetris','space'].includes(g.id)){
      await p.screenshot({path:path.join(output,g.id+'-desktop.png'),fullPage:!full,timeout:10000}).catch(e=>console.log('Screenshot warning '+g.id+': '+e.message));
    }
    await p.close()
  }
  const mobileTitles=['snake','pong','reaction','tap','hockey','breakaway','tetris','space','bowling','city','free-throw','goalkeeper','laser','rooftop'];
  for(const id of mobileTitles){
    const g=games.find(g=>g.id===id);
    const {p,errors,status}=await pageTo(browser,g.file,{width:390,height:844});
    check(id+' mobile loads',status===200);
    check(id+' mobile JS clean',errors.length===0);
    if(!['city','bowling'].includes(id))check(id+' mobile width',!(await horizontalOverflow(p)));
    await p.close()
  }
 }finally{await browser.close()}
 console.log('NEON DISTRICT 3.0 VISUAL QA: '+successes.length+' passed; '+failures.length+' failed.');
 if(failures.length){console.error('Failed checks:\n'+failures.map(x=>' - '+x).join('\n'));process.exitCode=1}
 else console.log('PASS 35 unique artwork cards, global visual themes, flagship layouts, game shells and mobile viewports.');
})().catch(e=>{console.error(e);process.exitCode=1});
