(function(root){
 'use strict';
 const valid=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{32}$/.test(value);
 function resolve(url,cached){
  const u=new URL(url),match=u.pathname.match(/^\/app\/([^/]+)\/?$/);
  const path=match?.[1],invite=new URLSearchParams(u.hash.slice(1)).get('espace');
  if((u.pathname.startsWith('/app/')&&!valid(path))||(invite!==null&&!valid(invite))||(path&&invite&&path!==invite))return null;
  return path||invite||(valid(cached)?cached:null);
 }
 const api={valid,resolve};
 if(typeof module!=='undefined')module.exports=api;
 if(!root.document)return;
 let cached=null;try{cached=root.localStorage.getItem('natif_shared_room');}catch{}
 api.room=resolve(root.location.href,cached);
 if(api.room){
  try{root.localStorage.setItem('natif_shared_room',api.room);}catch{}
  root.document.querySelector('link[rel="manifest"]').href='/api/manifest?espace='+api.room;
  // Keep the private workspace in the launch address even when storage is isolated.
  root.history.replaceState(null,'','/app/'+api.room);
 }
 api.notice=(text,retry=false)=>{
  const panel=document.getElementById('sync-access');if(!panel)return;
  panel.hidden=false;document.getElementById('sync-notice').textContent=text;
  document.getElementById('sync-retry').hidden=!retry;
 };
 api.ready=()=>{api.loaded=true;document.getElementById('sync-access').hidden=true;const app=document.getElementById('app');if(app)app.inert=false;};
 root.NatifWorkspace=api;
 document.addEventListener('DOMContentLoaded',()=>{
  const app=document.getElementById('app');if(app)app.inert=!api.loaded;
  if(!api.room){api.notice('Cet appareil n’est pas encore associé à vos carnets. Ouvrez ou collez le même lien privé que sur Chrome.');document.getElementById('space-form').hidden=false;}
  document.getElementById('sync-retry').onclick=()=>document.getElementById('cloud-retry').click();
  document.getElementById('space-form').onsubmit=event=>{
   event.preventDefault();let room=null;
   try{room=resolve(document.getElementById('space-link').value,null);}catch{}
   if(!room){api.notice('Ce lien ne contient pas un accès valide. Copiez le lien depuis « Partager l’accès » sur l’autre appareil.');return;}
   root.location.assign('/app/'+room);
  };
 });
})(typeof window==='undefined'?globalThis:window);
