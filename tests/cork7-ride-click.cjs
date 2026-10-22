'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const ENTRY='https://neonsarcade32.github.io/neon-district/cork7.html?nd_route_test=ride-v2';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:768},deviceScaleFactor:1,hasTouch:true});
  const navigated=[],errors=[];
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigated.push(frame.url())});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(ENTRY,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('button.bc-start.rd-start').first().waitFor({timeout:50000});
  console.log('Cork7 lobby loaded:',page.url());
  await page.locator('button.bc-start.rd-start').first().click();
  // Cork7 sometimes first opens a mountain selector; choose the first solo option.
  await page.waitForTimeout(1250);
  const mountain=page.locator('button.mountain-ride.is-ride');
  if(await mountain.count() && !new URL(page.url()).searchParams.has('park')){
    console.log('Mountain selector opened, choosing solo');
    await mountain.first().click();
  }
  try{await page.waitForURL(u=>u.pathname==='/neon-district/cork7.html'&&u.searchParams.has('park'),{timeout:17000});}catch(e){}
  const actual=new URL(page.url());
  console.log(JSON.stringify({url:actual.href,navigated,errors:errors.slice(-10),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,500)},null,2));
  fs.mkdirSync('test-artifacts',{recursive:true});
  await page.screenshot({path:'test-artifacts/cork7-ride-click.png'}).catch(()=>{});
  assert.equal(actual.pathname,'/neon-district/cork7.html','Ride must stay on Cork7 under Neon District instead of GitHub Pages root');
  assert(actual.searchParams.has('park'),'Ride must enter a selected Cork7 mountain');
  assert(!(await page.locator('body').innerText()).includes("There isn't a GitHub Pages site here"),'Ride landed on GitHub Pages 404');
  console.log('PASS: Clicking Ride stays in Neon District and navigates to a real mountain.');
 }finally{await browser.close()}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
