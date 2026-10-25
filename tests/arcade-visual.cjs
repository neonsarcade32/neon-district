'use strict';
// ND3 visual regression: real desktop/mobile layouts and visual screenshots.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const games=[...html.matchAll(/\bid:'([^']+)',name:'([^']+)',file:'([^']+)'/g)].map(m=>({id:m[1],name:m[2],page:m[3].split('?')[0]}));
const base=process.env.ARCADE_TEST_URL||'http://127.0.0.1:8080';
const output=path.join(root,'test-artifacts','nd3-visual');
fs.mkdirSync(output,{recursive:true});
const selection=new Set(['snake','pong','hockey','ski','traffic','tap','city','bowling','laser','pixelhop','open2048','offroad']);
async function inspect(page,name,standard,wide,save){
 const issues=[],summary=await page.evaluate(()=>{
  const doc=document.documentElement,body=document.body,stage=document.querySelector('.stage,.arena,.city,.game-container,#container'),h=document.querySelector('h1,.cityTitle strong,.app .brand');
  return {
   classSet:doc.classList.contains('nd3-game-ui'),
   stylesheet:!!document.querySelector('link[href*="nd3-game-skin.css"]'),
   bg:getComputedStyle(body).backgroundImage,
   bodyWidth:doc.scrollWidth,
   viewportWidth:innerWidth,
   stageHeight:stage?.getBoundingClientRect().height||0,
   headingVisible:!!h&&h.getBoundingClientRect().height>0,
   canvasCount:document.querySelectorAll('canvas').length,
   gameUI:!!document.querySelector('.nd3-commandbar'),
   cardCount:document.querySelectorAll('.gameCard').length,
   visualCards:document.querySelectorAll('.gameCard svg').length,
   textLength:(document.body.innerText||'').trim().length
  };
 });
 if(standard){
  if(!summary.classSet)issues.push('missing ND3 HTML game shell class');
  if(!summary.stylesheet)issues.push('missing new shared game stylesheet');
  if(!summary.bg.includes('gradient'))issues.push('missing gradient visual shell');
  if(!summary.headingVisible)issues.push('missing visible title');
  if(name!=='idle'&&!summary.gameUI)issues.push('missing ND3 game tools');
  if(!['reaction','tap','idle'].includes(name)&&summary.canvasCount<1)issues.push('missing game canvas');
  if(summary.stageHeight<120)issues.push('missing game screen');
 }else if(name==='pixelhop'||name==='open2048'||name==='offroad'){
  if(name!=='offroad'&&!summary.headingVisible)issues.push('missing visible imported game title');
  if(name!=='offroad'&&summary.stageHeight<120)issues.push('missing source game play area');
  if(name==='pixelhop'&&summary.canvasCount<1)issues.push('platformer canvas missing');
  if(name==='open2048'&&!await page.locator('.tile-container').count())issues.push('2048 tile engine missing');
  if(!await page.locator('a[href*="github.com"]').count())issues.push('upstream credit missing');
 }else if(name==='home'){
  if(summary.cardCount!==games.length)issues.push('game catalog has '+summary.cardCount+' of '+games.length);
  if(summary.visualCards!==games.length)issues.push('illustrated game cards has '+summary.visualCards+' of '+games.length);
  if(!await page.locator('.nd3-themebar [data-theme]').count())issues.push('no skin selector');
 }
 // Browsers differ slightly in scrollbar width. Ignore <30px of overflow.
 if(summary.bodyWidth>summary.viewportWidth+30)issues.push('horizontal clipping: '+summary.bodyWidth+'px against '+summary.viewportWidth+'px viewport');
 if(save){
  try{await page.screenshot({path:path.join(output,name+(wide?'-desktop':'-mobile')+'.png'),fullPage:name==='home',timeout:25000})}
  catch(e){
    try{await page.screenshot({path:path.join(output,name+(wide?'-desktop':'-mobile')+'.png'),fullPage:false,animations:'disabled',timeout:12000})}
    catch(retryError){console.warn('Screenshot skipped '+name+': '+retryError.message)}
  }
 }
 return {issues,summary};
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-gpu','--use-gl=swiftshader']});
 const failures=[];let checks=0;
 try{
  for(const wide of [true,false]){
   for(const g of [{id:'home',page:'index.html',name:'Home'},...games]){
    const page=await browser.newPage({viewport:wide?{width:1440,height:900}:{width:390,height:844},deviceScaleFactor:1,isMobile:!wide,hasTouch:!wide,reducedMotion:'reduce'});
    try{
     const response=await page.goto(base+'/'+g.page,{waitUntil:'domcontentloaded',timeout:30000});
     assert.equal(response.status(),200);
     await page.waitForTimeout(g.id==='city'||g.id==='bowling'?1300:120);
     const standard=!['home','city','bowling','pixelhop','open2048','offroad'].includes(g.id);
     const r=await inspect(page,g.id,standard,wide,g.id==='home'||selection.has(g.id));
     if(r.issues.length)failures.push((wide?'desktop ':'mobile ')+g.id+': '+r.issues.join('; '));
     else {checks++;console.log('PASS '+(wide?'desktop':'mobile')+' '+g.id+(standard?' · shared ND3 game interface':''))}
    }catch(e){failures.push((wide?'desktop ':'mobile ')+g.id+': '+e.message)}
    finally{await page.close()}
   }
  }
 }finally{await browser.close()}
 console.log('Visual checks passed: '+checks+'/'+((games.length+1)*2)+'; screenshots saved to test-artifacts/nd3-visual.');
 if(failures.length){console.error('VISUAL FAILURES:\n'+failures.join('\n'));process.exitCode=1}
})().catch(e=>{console.error(e);process.exitCode=1});
