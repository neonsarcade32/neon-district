/* Neon District | Cork7 mobile graphics settings. Page controls; no gameplay changes. */
(function(){
  'use strict';
  var mobile=/iPad|iPhone|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!mobile)return;
  var key='nd-cork7-mobile-graphics';
  var modes=[['smooth','Smooth','Faster gameplay, lower detail'],['balanced','Balanced','Clearer image, moderate GPU use'],['sharp','Sharp','Highest detail; may run slower']];
  function current(){try{var q=localStorage.getItem(key);return q==='smooth'||q==='sharp'?q:'balanced'}catch(e){return 'balanced'}}
  function mount(){
    if(document.getElementById('nd-cork7-graphics'))return;
    var host=document.createElement('div');host.id='nd-cork7-graphics';
    host.style.cssText='position:fixed;right:10px;top:calc(env(safe-area-inset-top,0px) + 67px);z-index:2147483600;font:12px/1.4 system-ui,-apple-system,sans-serif;color:#eaffff';
    var btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-label','Change Cork7 graphics quality');btn.style.cssText='padding:9px 12px;color:#eaffff;background:#0a2539ee;border:1px solid #71d4ec;border-radius:12px;box-shadow:0 3px 18px #0008;font:700 12px system-ui;cursor:pointer;touch-action:manipulation';
    var panel=document.createElement('div');panel.hidden=true;
    panel.style.cssText='box-sizing:border-box;margin-top:7px;width:208px;max-width:calc(100vw - 20px);padding:10px;border-radius:13px;border:1px solid #6bd4ec;background:#091d30f5;box-shadow:0 8px 25px #000b';
    var label=document.createElement('div');label.textContent='MOBILE GRAPHICS';label.style.cssText='font-weight:800;color:#8bf5ea;letter-spacing:.8px;margin:1px 0 8px';
    panel.appendChild(label);
    function refresh(){
      var q=current();btn.textContent='⚙ Graphics: '+(modes.find(function(x){return x[0]===q})||modes[1])[1];
      Array.from(panel.querySelectorAll('[data-quality]')).forEach(function(node){var selected=node.dataset.quality===q;node.style.background=selected?'#195c79':'#0f3147';node.style.borderColor=selected?'#87ebff':'#456b83';node.setAttribute('aria-pressed',String(selected))});
    }
    modes.forEach(function(option){
      var b=document.createElement('button');b.type='button';b.dataset.quality=option[0];
      b.style.cssText='box-sizing:border-box;display:block;width:100%;margin:4px 0;padding:9px;border:1px solid #456b83;border-radius:9px;color:#ecfbff;font:700 12px system-ui;text-align:left;cursor:pointer;touch-action:manipulation';
      var head=document.createElement('div');head.textContent=option[1];
      var desc=document.createElement('small');desc.textContent=option[2];desc.style.cssText='display:block;color:#a5cbd9;font:10px/1.4 system-ui;margin-top:3px';
      b.appendChild(head);b.appendChild(desc);
      b.addEventListener('click',function(event){
        event.stopPropagation();
        var changed=current()!==option[0];
        try{localStorage.setItem(key,option[0])}catch(e){}
        refresh();panel.hidden=true;btn.setAttribute('aria-expanded','false');
        if(changed&&!/cork7-start\.html/.test(location.pathname))location.reload();
      });
      panel.appendChild(b);
    });
    btn.addEventListener('click',function(event){event.stopPropagation();panel.hidden=!panel.hidden;btn.setAttribute('aria-expanded',String(!panel.hidden))});
    btn.setAttribute('aria-expanded','false');
    host.appendChild(btn);host.appendChild(panel);
    document.body.appendChild(host);
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();