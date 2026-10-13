const CACHE='natif-body-v3-cache-7';
const ASSETS=['/index.html','/workspace.js','/sync-core.js','/firebase-sync.js','/manifest.webmanifest','/icon-192.png','/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('natif-body-v3-cache-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const navigation=event.request.mode==='navigate';
 if(!navigation&&!ASSETS.includes(url.pathname))return;
 event.respondWith(fetch(event.request).then(async response=>{
  if(response.ok){const cache=await caches.open(CACHE);await cache.put(navigation?'/index.html':url.pathname,response.clone());}
  return response;
 }).catch(()=>caches.match(navigation?'/index.html':url.pathname)));
});
