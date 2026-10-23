'use strict';
/*
 * Browser-level UI test with synthetic Cork7 auth, relationships, and realtime.
 * Uses NO real player accounts. Separate live probe checks Supabase connectivity.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const project=path.resolve(__dirname,'..');
const prefix='https://neonsarcade32.github.io/neon-district/';
const mockSupabase=`
const myId='11111111-1111-4111-8111-111111111111';
const friendId='22222222-2222-4222-8222-222222222222';
const pendingId='33333333-3333-4333-8333-333333333333';
const session=new URL(location.href).searchParams.has('signedOut')?null:{user:{id:myId}};
class MockChannel{
 constructor(){this.handlers=[];this.data={};this.sent=[];}
 on(type,options,callback){this.handlers.push({type,event:options.event,callback});return this;}
 async track(){return 'ok'}
 async untrack(){return 'ok'}
 async unsubscribe(){return 'ok'}
 presenceState(){return this.data}
 async send(message){this.sent.push(message);window.__ndTestSent=message;return 'ok'}
 subscribe(callback){
  setTimeout(async()=>{
   callback('SUBSCRIBED');
   const id='neon-district-cork7-friend-v1:'+friendId;
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));
   const friendKey=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
   this.data={[friendKey]:[{v:1,park:'apex',at:Date.now()}]};
   for(const handler of this.handlers)if(handler.type==='presence'&&handler.event==='sync')handler.callback();
  },55);
  return this;
 }
}
const channel=new MockChannel();
const api={
 auth:{
   onAuthStateChange(callback){return {data:{subscription:{unsubscribe(){}}}}},
   async getSession(){return {data:{session},error:null}}
 },
 rpc:async name=>({data:name==='my_friends'?[
  {account:friendId,handle:'ALEXTEST',state:'friends'},
  {account:pendingId,handle:'PENDINGTEST',state:'you-asked'}
 ]:null,error:null}),
 channel:()=>channel,
 removeChannel:async()=>null
};
window.__ndTestChannel=channel;
export function t(){return api}
`;
async function test(browser,signedOut){
 const context=await browser.newContext({viewport:{width:600,height:720}});
 await context.route('**/cork7-neon-friends-test.html*',route=>route.fulfill({status:200,contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="cork7-neon-friends.css"></head><body><script type="module" src="cork7-neon-friends.js"></script></body></html>`}));
 await context.route('**/cork7-assets/_next/static/chunks/supabase-BEhtaJUq.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:mockSupabase}));
 for(const asset of ['cork7-neon-friends.js','cork7-neon-friends.css']){
  await context.route('**/'+asset,route=>route.fulfill({status:200,contentType:asset.endsWith('.js')?'text/javascript':'text/css',body:fs.readFileSync(path.join(project,asset),'utf8')}));
 }
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 try{
  await page.goto(prefix+'cork7-neon-friends-test.html'+(signedOut?'?signedOut=1':''));
  await page.locator('.nd-friends-toggle').waitFor({timeout:10000});
  await page.locator('.nd-friends-toggle').click();
  if(signedOut){
   await page.getByText('Sign in to a Cork7 account',{exact:false}).waitFor();
   assert.equal(await page.locator('.nd-friends-person').count(),0);
   console.log('PASS: signed-out users get an honest sign-in prompt, not fake friend statuses');
  }else{
   await page.getByText('ALEXTEST',{exact:true}).waitFor({timeout:10000});
   await page.getByText('Online in Neon District',{exact:true}).waitFor();
   assert.equal(await page.getByText('PENDINGTEST').count(),0,'Unaccepted friend requests must never appear');
   await page.locator('.nd-friends-person .nd-friends-invite').click();
   await page.waitForFunction(()=>window.__ndTestSent?.event==='neon-mountain-invite');
   const message=await page.evaluate(()=>window.__ndTestSent);
   assert.equal(message.payload.park,'nordryggen');
   assert.equal(message.payload.to.length,64);
   assert.notEqual(message.payload.to,'22222222-2222-4222-8222-222222222222');
   await page.getByText('Mountain invitation sent to ALEXTEST.',{exact:true}).waitFor();
   console.log('PASS: accepted friends display ONLINE and privacy-preserving invitation is emitted');
  }
  assert.deepEqual(pageErrors,[],'No browser JS exceptions: '+pageErrors.join('; '));
 }finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{await test(browser,false);await test(browser,true);}
 finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
