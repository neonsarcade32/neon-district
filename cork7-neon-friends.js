/*
 * Neon District Cork7 Friends: separate, opt-in UI for signed-in players.
 * Uses the public Supabase Realtime channel already supported by Cork7;
 * does not access or bypass Cork7's origin-restricted Cloudflare friends hub.
 * Presence is a convenience indicator, not proof of game-server availability.
 */
import {t as getCork7Supabase} from './cork7-assets/_next/static/chunks/supabase-BEhtaJUq.js';

const TOPIC='neon-district-cork7-presence-v1';
const ALLOWED_PARKS=new Set(['nordryggen','apex','shirakumo','bigair','forestline','halfpipe']);
const PARK_NAMES={nordryggen:'Nordryggen',apex:'APEX',shirakumo:'Shirakumo',bigair:'Big Air',forestline:'Forest Line',halfpipe:'Halfpipe'};
const UPDATE_INTERVAL=35000;
const FRIEND_REFRESH_INTERVAL=90000;
const state={
  status:'loading',authorized:false,userId:null,selfKey:null,
  friends:[],presence:{},channel:null,error:'',friendsError:'',
  generation:0,connected:false,ready:false,inviteToast:null,
  pendingInvite:false,inviteCooldown:new Map(),lastFriendRefresh:0
};
let client,authSubscription,root,toggle,panel,presenceTimer,refreshTimer;
let renderScheduled=false;

function node(tag,className,text){
 const item=document.createElement(tag);
 if(className)item.className=className;
 if(text!==undefined)item.textContent=String(text);
 return item;
}
function button(text,className,onClick){
 const item=node('button',className,text);
 item.type='button';
 item.addEventListener('click',onClick);
 return item;
}
function currentPark(){
 const park=new URLSearchParams(location.search).get('park');
 return ALLOWED_PARKS.has(park)?park:'nordryggen';
}
async function anonymousKey(accountId){
 const prefix='neon-district-cork7-friend-v1:';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(prefix+accountId));
 return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
function availableFriend(friend){
 if(!state.connected||!friend?.key)return false;
 const entries=state.presence[friend.key];
 return Array.isArray(entries)&&entries.some(entry=>entry&&entry.v===1);
}
function onlineCount(){return state.friends.filter(availableFriend).length;}
function labelForStatus(){
 switch(state.status){
  case 'online':return 'CONNECTED';
  case 'connecting':return 'CONNECTING';
  case 'unavailable':return 'UNAVAILABLE';
  case 'signed-out':return 'SIGN IN';
  default:return 'CHECKING';
 }
}
function queueRender(){
 if(renderScheduled)return;
 renderScheduled=true;
 requestAnimationFrame(()=>{renderScheduled=false;render();});
}
function render(){
 if(!root)return;
 const count=onlineCount();
 toggle.replaceChildren(node('span','nd-friend-light'+(state.connected?' is-on':'')),
   node('span','',state.authorized?'NEON FRIENDS  '+count+' ONLINE':'NEON FRIENDS'));
 toggle.setAttribute('aria-label','Neon Friends: '+(state.authorized?count+' online':'sign in required'));
 if(panel.hidden)return;
 const content=node('div','nd-friends-inner');
 const header=node('div','nd-friends-head');
 const title=node('strong','','NEON FRIENDS');
 header.append(title,button('×','nd-friends-close',()=>setOpen(false)));
 content.append(header);
 const indicator=node('div','nd-friends-status');
 const led=node('span','nd-friends-status-light'+(state.connected?' is-on':''));
 indicator.append(led,node('strong','',labelForStatus()));
 if(state.authorized&&state.connected)indicator.append(node('span','nd-friends-status-note',count+' of '+state.friends.length+' friends online'));
 content.append(indicator);

 if(!state.authorized){
  content.append(node('p','nd-friends-info','Sign in to a Cork7 account to see accepted friends playing through Neon District.'));
 }else{
  if(state.status==='connecting')content.append(node('p','nd-friends-info','Connecting to Neon District’s separate presence channel…'));
  if(state.status==='unavailable')content.append(node('p','nd-friends-error',state.error||'Realtime friend status is unavailable. Try reloading.'));
  if(state.friendsError)content.append(node('p','nd-friends-error',state.friendsError));
  if(!state.friends.length){
   content.append(node('p','nd-friends-info','No accepted Cork7 friends loaded. Add a friend in Cork7, then refresh here.'));
  }else{
   const list=node('div','nd-friends-list');
   const sorted=[...state.friends].sort((a,b)=>Number(availableFriend(b))-Number(availableFriend(a))||a.handle.localeCompare(b.handle));
   for(const friend of sorted){
    const item=node('div','nd-friends-person');
    const info=node('div','nd-friends-person-info');
    const name=node('strong','',friend.handle);
    const available=availableFriend(friend);
    const status=node('span','nd-friends-person-status'+(available?' is-on':''),available?'Online in Neon District':'Not online in Neon District');
    info.append(name,status);
    item.append(info);
    if(available)item.append(button('Invite','nd-friends-invite',()=>void sendInvite(friend)));
    list.append(item);
   }
   content.append(list);
  }
  const actions=node('div','nd-friends-actions');
  actions.append(button('Refresh friends','nd-friends-refresh',()=>void refreshFriends(state.generation)));
  content.append(actions);
 }
 content.append(node('p','nd-friends-footnote','Neon status and mountain invites are separate from Cork7 multiplayer. Joining a mountain opens an individual ride, not a shared room.'));
 panel.replaceChildren(content);
}
function setOpen(open){
 panel.hidden=!open;
 toggle.setAttribute('aria-expanded',String(open));
 if(open&&state.authorized&&Date.now()-state.lastFriendRefresh>15000)void refreshFriends(state.generation);
 queueRender();
}
function setupUI(){
 if(root)return;
 root=node('aside','nd-friends-root');
 root.id='nd-cork7-friends';
 root.setAttribute('aria-label','Neon District friends');
 toggle=button('NEON FRIENDS','nd-friends-toggle',()=>setOpen(panel.hidden));
 toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-controls','nd-friends-panel');
 panel=node('section','nd-friends-panel');
 panel.id='nd-friends-panel';
 panel.hidden=true;
 root.append(toggle,panel);
 document.body.append(root);
 queueRender();
}
function clearToast(){
 if(state.inviteToast)state.inviteToast.remove();
 state.inviteToast=null;
}
function toast(message,invite){
 clearToast();
 const bar=node('div','nd-friends-toast');
 bar.setAttribute('role','status');
 bar.append(node('span','',message));
 if(invite){
  bar.append(button('Join mountain','nd-friends-invite',()=>{
    const url=new URL('cork7.html',location.href);
    url.searchParams.set('park',invite.park);
    url.searchParams.set('mode','solo');
    location.assign(url.href);
  }));
 }
 bar.append(button('×','nd-friends-dismiss',clearToast));
 state.inviteToast=bar;
 document.body.append(bar);
 if(!invite)setTimeout(()=>{if(state.inviteToast===bar)clearToast();},4500);
 else setTimeout(()=>{if(state.inviteToast===bar)clearToast();},30000);
}
function recordError(message){
 state.error=message;
 try{window.__ndCork7Log?.push('NEON FRIENDS: '+message.slice(0,160));}catch{}
 queueRender();
}
async function refreshFriends(expectedGeneration){
 if(!client||!state.userId||expectedGeneration!==state.generation)return;
 state.lastFriendRefresh=Date.now();
 try{
  const {data,error}=await client.rpc('my_friends');
  if(error)throw Error('The Cork7 friends list could not be loaded.');
  if(!Array.isArray(data))throw Error('Unexpected friends list format.');
  const relationships=data.filter(item=>item?.state==='friends'&&typeof item.account==='string'&&typeof item.handle==='string');
  const friends=await Promise.all(relationships.map(async item=>({
   key:await anonymousKey(item.account),
   handle:item.handle.slice(0,36)
  })));
  if(expectedGeneration!==state.generation)return;
  state.friends=friends;
  state.friendsError='';
 }catch(error){
  if(expectedGeneration!==state.generation)return;
  state.friendsError=String(error?.message||'Unable to refresh the Cork7 friends list.').slice(0,150);
 }
 queueRender();
}
async function publishPresence(expectedGeneration){
 if(!state.channel||!state.connected||!state.selfKey||expectedGeneration!==state.generation)return;
 try{
  const result=await state.channel.track({v:1,park:currentPark(),at:Date.now()});
  if(result!=='ok')recordError('Friend presence update did not succeed: '+result);
 }catch(_){recordError('Could not update online status.');}
}
function onPresenceChanged(){
 try{state.presence=state.channel?.presenceState()||{};}catch{state.presence={};}
 queueRender();
}
function onInvite(payload){
 if(!state.connected||!state.authorized||!payload||typeof payload!=='object')return;
 if(payload.to!==state.selfKey||!ALLOWED_PARKS.has(payload.park))return;
 if(typeof payload.from!=='string'||typeof payload.at!=='number'||Math.abs(Date.now()-payload.at)>120000)return;
 const friend=state.friends.find(item=>item.key===payload.from);
 if(!friend)return;
 const latest=state.inviteCooldown.get(payload.from)||0;
 if(Date.now()-latest<9000)return;
 state.inviteCooldown.set(payload.from,Date.now());
 toast(friend.handle+' invited you to '+PARK_NAMES[payload.park]+'. Open the same mountain?',{park:payload.park});
}
async function sendInvite(friend){
 if(!state.connected||!state.channel||!state.selfKey||!availableFriend(friend))return;
 if(state.pendingInvite)return;
 const now=Date.now();
 if(now-(state.inviteCooldown.get('sent:'+friend.key)||0)<10000){
  toast('You already invited '+friend.handle+' recently.');
  return;
 }
 state.pendingInvite=true;
 try{
  const result=await state.channel.send({type:'broadcast',event:'neon-mountain-invite',payload:{
   v:1,to:friend.key,from:state.selfKey,park:currentPark(),at:now
  }});
  if(result!=='ok')throw Error('Invite service is not responding.');
  state.inviteCooldown.set('sent:'+friend.key,now);
  toast('Mountain invitation sent to '+friend.handle+'.');
 }catch(error){
  toast('Could not send invitation. Check the connection and try again.');
 }finally{state.pendingInvite=false;queueRender();}
}
async function stopChannel(){
 if(state.channel){
  const old=state.channel;state.channel=null;
  try{await old.untrack();}catch{}
  try{await client.removeChannel(old);}catch{}
 }
}
async function startForSession(session){
 const uid=session?.user?.id||null;
 if(uid===state.userId&&((!uid)||state.channel))return;
 const generation=++state.generation;
 state.userId=uid;
 state.selfKey=null;
 state.authorized=!!uid;
 state.connected=false;
 state.presence={};
 state.friends=[];
 state.friendsError='';
 state.error='';
 state.status=uid?'connecting':'signed-out';
 if(presenceTimer)clearInterval(presenceTimer);
 if(refreshTimer)clearInterval(refreshTimer);
 presenceTimer=refreshTimer=null;
 // Do not wait for an old channel's network timeout before a fresh login.
 void stopChannel();
 queueRender();
 if(!uid)return;
 try{
  const key=await anonymousKey(uid);
  if(generation!==state.generation)return;
  state.selfKey=key;
  const channel=client.channel(TOPIC,{
   config:{presence:{key},broadcast:{ack:true,self:false},private:false}
  });
  state.channel=channel;
  channel.on('presence',{event:'sync'},onPresenceChanged);
  channel.on('broadcast',{event:'neon-mountain-invite'},({payload})=>onInvite(payload));
  channel.subscribe(status=>{
   if(generation!==state.generation)return;
   if(status==='SUBSCRIBED'){
    state.connected=true;
    state.status='online';
    state.error='';
    void publishPresence(generation);
   }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
    state.connected=false;
    state.status='unavailable';
    recordError('The Neon Friends connection was interrupted.');
   }
   queueRender();
  });
  presenceTimer=setInterval(()=>void publishPresence(generation),UPDATE_INTERVAL);
  refreshTimer=setInterval(()=>void refreshFriends(generation),FRIEND_REFRESH_INTERVAL);
  void refreshFriends(generation);
 }catch(_){
  if(generation!==state.generation)return;
  state.status='unavailable';
  recordError('Neon Friends failed to initialize.');
 }
}
async function start(){
 if(!document.body){document.addEventListener('DOMContentLoaded',()=>void start(),{once:true});return;}
 setupUI();
 if(!globalThis.crypto?.subtle){
  state.status='unavailable';
  recordError('Neon Friends requires a secure HTTPS browser session.');
  return;
 }
 try{
  client=getCork7Supabase();
  if(!client)throw Error('Cork7 account services are unavailable.');
  const {data}=client.auth.onAuthStateChange((_event,session)=>{
   // Defer auth callbacks: Supabase requires avoiding async database work
   // inside its own auth lock.
   setTimeout(()=>void startForSession(session),0);
  });
  authSubscription=data?.subscription;
  const {data:sessionData,error}=await client.auth.getSession();
  if(error)throw error;
  state.ready=true;
  await startForSession(sessionData?.session);
  document.addEventListener('visibilitychange',()=>{
   if(document.visibilityState!=='visible')return;
   void publishPresence(state.generation);
   if(state.authorized&&Date.now()-state.lastFriendRefresh>60000)void refreshFriends(state.generation);
  });
  window.addEventListener('online',()=>void publishPresence(state.generation));
  window.addEventListener('pagehide',()=>{if(state.channel)void state.channel.untrack().catch(()=>{});});
 }catch(error){
  state.status='unavailable';
  recordError('Cork7 account services could not start. Reload or sign in again.');
 }
}
void start();
