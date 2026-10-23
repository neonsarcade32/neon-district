'use strict';
// Non-authenticated origin-specific Cork7 hub connectivity test.
// NEVER sends, requests, or prints user credentials.
const WebSocket=require('ws');
const origins=['https://cork7.com','https://neonsarcade32.github.io'];
const endpoint='wss://whiteout-mountain.kkgzkbcvbf.workers.dev/parties/friends/hub';
function check(origin){
 return new Promise(resolve=>{
  let settled=false,opened=false,firstType='',code=null,reason='',httpStatus=null,detail='';
  let ws;
  const timer=setTimeout(()=>finish(),9500);
  function finish(){
   if(settled)return;settled=true;clearTimeout(timer);
   try{ws?.terminate()}catch{}
   resolve({origin,opened,firstType,code,reason,httpStatus,detail});
  }
  try{
   ws=new WebSocket(endpoint,{origin,handshakeTimeout:7000,perMessageDeflate:false});
   ws.once('open',()=>{opened=true;setTimeout(finish,800)});
   ws.once('message',data=>{
    try{const obj=JSON.parse(String(data));firstType=typeof obj.t==='string'?obj.t:'other'}
    catch{firstType='unreadable'}
    finish();
   });
   ws.once('unexpected-response',(_req,res)=>{
    httpStatus=res.statusCode;
    detail='Upgrade refused';
    res.resume();
    finish();
   });
   ws.once('close',(c,r)=>{code=c;reason=String(r).slice(0,80);finish()});
   ws.once('error',err=>{detail=String(err.message).slice(0,180);finish()});
  }catch(e){detail=String(e.message).slice(0,180);finish()}
 });
}
(async()=>{
 const results=[];
 for(const origin of origins){
  const result=await check(origin);
  console.log('HUB ORIGIN PROBE',JSON.stringify(result));
  results.push(result);
 }
 const neon=results.find(r=>r.origin==='https://neonsarcade32.github.io');
 const original=results.find(r=>r.origin==='https://cork7.com');
 if(!original?.opened){
  console.error('BLOCKER: Original Cork7 site cannot reach the friends presence hub either. Check service health.');
  process.exitCode=1;
 }else if(!neon?.opened){
  console.error('BLOCKER: Neon District is not authorized to connect to the Cork7 friends hub (HTTP '+(neon?.httpStatus??'unknown')+').');
  console.error('ACTION REQUIRED ON CORK7 WORKER: add https://neonsarcade32.github.io to the WebSocket Upgrade origin allowlist; keep JWT and account checks unchanged.');
  process.exitCode=1;
 }else{
  console.log('PASS: Both Cork7 and Neon District origins are accepted for unauthenticated WebSocket handshake (auth is still required).');
 }
})().catch(err=>{console.error(err.message);process.exitCode=1});
