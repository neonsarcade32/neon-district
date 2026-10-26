/* First-party Neon District host for Cork7's original browser game.
 * This bypasses the upstream Vinext/RSC document hydration, which requires
 * an upstream server stream unavailable from a static GitHub Pages mirror.
 * It does NOT replace the original Cork7 3D engine or game UI.
 */
import {i as requireReact, t as requireReactDOMClient} from './cork7-assets/_next/static/chunks/framework-D_rUT4EX.js';

const root=document.getElementById('cork7-root');
const startup=document.getElementById('nd-cork7-startup-status');
function showError(message,detail){
  if(window.__ndCork7Log)window.__ndCork7Log.push(message+' '+String(detail?.stack||detail||'').slice(0,700));
  console.error('[Neon District Cork7]',message,detail||'');
  const banner=document.createElement('div');
  banner.id='__next_error__';
  banner.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#061824;color:#f0fcff;display:grid;place-content:center;text-align:center;padding:24px;font:16px/1.5 system-ui,sans-serif';
  const title=document.createElement('h1');
  title.textContent='Cork7 could not start';
  const msg=document.createElement('p');
  msg.textContent=message;
  const retry=document.createElement('a');
  retry.href=location.href;
  retry.style.cssText='display:inline-block;color:#061824;background:#9cedf7;border-radius:9px;padding:10px 20px;text-decoration:none;font-weight:800';
  retry.textContent='Reload Cork7';
  banner.append(title,msg,retry);
  root.replaceChildren(banner);
}
async function boot(){
  try {
    // Keep the game and its dependency graph intact: only the React mount
    // changes from server-hydration to a local client-rendered application.
    const {default:Cork7}=await import('./cork7-assets/_next/static/chunks/game-client-ND-standalone.js?nd-neonpeak-fix=20261026-v3');
    if(typeof Cork7!=='function')throw new Error('Cork7 gameplay component missing');
    const React=requireReact();
    const ReactDOM=requireReactDOMClient();
    if(!React?.createElement||!ReactDOM?.createRoot)throw new Error('Cork7 React runtime unavailable');
    if(startup)startup.remove();
    const app=ReactDOM.createRoot(root,{
      onUncaughtError:(error)=>showError('The 3D game encountered an error.',error),
      onRecoverableError:(error)=>window.__ndCork7Log?.push('RECOVERABLE: '+String(error))
    });
    window.__ND_CORK7_REACT_ROOT__=app;
    app.render(React.createElement(Cork7));
  } catch(err) {
    showError('Cork7 game modules failed to initialize.',err);
  }
}
boot();
