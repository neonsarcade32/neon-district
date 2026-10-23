'use strict';
// Two-client live test: confirms the channel can exchange presence without
// real player accounts or touching the original Cork7 friends Worker.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const WebSocket=require('ws');
const assert=require('node:assert/strict');

const source=fs.readFileSync(path.resolve(__dirname,'../cork7-assets/_next/static/chunks/supabase-BEhtaJUq.js'),'utf8');
const match=source.match(/la\(\`(https:\/\/[^\`]+\.supabase\.co)\`,\`(sb_publishable_[A-Za-z0-9_]+)\`/);
assert(match,'Cork7 public Supabase configuration is not in its bundled SDK');
const [,url,key]=match;
const endpoint=new URL(url.replace('https:','wss:')+'/realtime/v1/websocket');
endpoint.searchParams.set('apikey',key);
endpoint.searchParams.set('vsn','2.0.0');
const topic='realtime:neon-district-cork7-presence-v1';
const firstKey='probe-a-'+crypto.randomBytes(8).toString('hex');
const secondKey='probe-b-'+crypto.randomBytes(8).toString('hex');
const clients=[];

function client(key){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(endpoint.toString(),{handshakeTimeout:6000});
  clients.push(socket);
  const timer=setTimeout(()=>reject(Error('Join timeout')),11000);
  socket.on('open',()=>socket.send(JSON.stringify(['1','1',topic,'phx_join',{config:{
   broadcast:{ack:true,self:false},presence:{key,enabled:true},private:false
  }}])));
  const events=[];
  socket.on('message',raw=>{
   let frame;try{frame=JSON.parse(String(raw))}catch{return}
   const event=Array.isArray(frame)?frame[3]:frame.event;
   const payload=Array.isArray(frame)?frame[4]:frame.payload;
   events.push({event,payload});
   if(event==='phx_reply'&&payload?.status==='ok'){
    clearTimeout(timer);
    resolve({socket,key,events});
   }else if(event==='phx_reply'&&payload?.status==='error'){
    clearTimeout(timer);
    reject(Error('Channel join denied: '+JSON.stringify(payload?.response).slice(0,180)));
   }
  });
  socket.once('error',e=>{clearTimeout(timer);reject(e)});
  socket.once('close',code=>{clearTimeout(timer);reject(Error('Channel closed: '+code))});
 });
}
async function run(){
 const [a,b]=await Promise.all([client(firstKey),client(secondKey)]);
 console.log('PASS: both test clients joined their own Neon District presence channel');
 a.socket.send(JSON.stringify(['1','2',topic,'presence',{type:'presence',event:'track',payload:{v:1,probe:true}}]));
 const seen=()=>b.events.some(({event,payload})=>
  (event==='presence_diff'&&payload?.joins?.[firstKey]?.metas?.length>0)||
  (event==='presence_state'&&payload?.[firstKey]?.metas?.length>0)
 );
 const until=Date.now()+8500;
 while(Date.now()<until&&!seen())await new Promise(resolve=>setTimeout(resolve,120));
 assert(seen(),'Second client must receive the first client presence record');
 console.log('PASS: two independent Neon District sessions see each other ONLINE through Supabase Realtime');
}
run().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1}).finally(()=>{
 for(const socket of clients){try{socket.terminate()}catch{}}
});
