'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const html=fs.readFileSync('cork7.html','utf8');
const matched=html.match(/<script id="nd-cork7-error-panel-v2">([\s\S]*?)<\/script>/);
assert(matched,'Cork7 v2 crash monitor is embedded in game bootstrap');
new Function(matched[1]); // parse without invoking DOM
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:768}});
  await page.setContent('<html><head><script>'+matched[1].replace(/<\/script/gi,'<\\/script')+'</script></head><body><main id="app">Cork7 game</main></body></html>');
  await page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{message:'Synthetic test crash',filename:'sample.js'})));
  await page.evaluate(()=>{document.body.innerHTML='<div id="__next_error__"><h1>This page couldn’t load</h1></div>'});
  await page.waitForSelector('#nd-cork7-diagnostic-card-v2',{timeout:4500});
  const text=await page.locator('#nd-cork7-diagnostic-message-v2').innerText();
  assert(text.includes('Synthetic test crash'),'Actual logged JavaScript error should appear in diagnostic card');
  assert(text.includes('sample.js'),'Source filename should appear in diagnostic card');
  const backup=await page.locator('#nd-cork7-diagnostic-card-v2 a').getAttribute('href');
  assert(backup.endsWith('/cork7-start.html'),'Fallback must take user back to park launcher');
  console.log('PASS Cork7 v2 crash diagnostics: React error screen detected, overlay mounted, error captured, and recovery works');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});