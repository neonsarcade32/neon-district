/* Cork7 integration bridge for Neon District — uses the official client at runtime. */
(()=>{'use strict';
 for(const name of ['pushState','replaceState']){
  const original=History.prototype[name];
  History.prototype[name]=function(state,title,url){
   if(url){
    const parsed=new URL(String(url),document.baseURI);
    url=parsed.origin===location.origin?parsed.href:location.origin+location.pathname+parsed.search+parsed.hash;
   }
   return Reflect.apply(original,this,[state,title,url]);
  };
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('button.mountain-ride.is-ride');
  if(!button||!button.textContent.includes('RIDE SOLO'))return;
  const card=document.querySelector('.mountain-card');
  const park=card?.className.match(/card-([a-z0-9-]+)/i)?.[1];
  if(!park)return;
  event.preventDefault();event.stopImmediatePropagation();
  const target=new URL(location.href);
  target.searchParams.set('park',park);
  target.searchParams.set('mode','solo');
  location.assign(target.href);
 },true);
})();