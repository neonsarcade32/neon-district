'use strict';
// Minimal public, anonymous WebSocket handshake probe for the Supabase Realtime
// service already bundled with the official Cork7 client.
// Does not use or collect player credentials; writes no player records.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const WebSocket=require('ws');
const source=fs.readFileSync(path.join(__dirname,'..','cork7-assets','_next','static','chunks','supabase-BEhtaJUq.js'),'utf8');
const match=source.match(/la\(\`(https:\/\/[^\`]+\.supabase\.co)\`,\`(sb_publishable_[A-Za-z0-9_]+)\`/);
assert(match,'Official embedded Supabase public project config must be discoverable');
const [,url,key]=match;
const topic='realtime:neon-district-cork7-presence-v1';
const endpoint=new URL(url.replace('https:','wss:')+'/realtime/v1/websocket');
endpoint.searchParams.set('apikey',key);
endpoint.searchParams.set('vsn','2.0.0');
let finished=false;
const ws=new WebSocket(endpoint.toString(),{handshakeTimeout:6500});
const timer=setTimeout(()=>fail('No Supabase Realtime join confirmation in 12 seconds'),12000);
function finish(code,text){
 if(finished)return;
 finished=true;
 clearTimeout(timer);
 console.log(text);
 try{ws.terminate()}catch{}
 if(code)process.exitCode=code;
}
function fail(message){finish(1,'FAIL: '+message)}
ws.on('open',()=>{
 console.log('Connected to Supabase Realtime websocket');
 ws.send(JSON.stringify(['1','1',topic,'phx_join',{config:{
  broadcast:{ack:false,self:false},presence:{key:'probe',enabled:true},private:false
 }}]));
});
ws.on('message',(buffer)=>{
 let msg;try{msg=JSON.parse(String(buffer))}catch{return}
 const event=Array.isArray(msg)?msg[3]:msg.event;
 const payload=Array.isArray(msg)?msg[4]:msg.payload;
 console.log('Realtime event:',event, event==='phx_reply' ? 'status='+String(payload?.status):'');
 if(event==='phx_reply'){
  if(payload?.status==='ok')finish(0,'PASS: Neon District can establish an independent public Supabase Realtime presence channel.');
  else fail('Realtime join was rejected: '+JSON.stringify(payload?.response||payload).slice(0,220));
 }else if(event==='phx_error')fail('Channel reported an error');
});
ws.on('unexpected-response',(_req,res)=>{const status=res.statusCode;res.resume();fail('WebSocket HTTP '+status)});
ws.on('error',err=>fail('Realtime socket '+err.message.slice(0,180)));
ws.on('close',(c,r)=>{if(!finished)fail('Realtime closed '+c+' '+String(r).slice(0,90))});
