const CACHE='pat-v13';
const ASSETS=['./','index.html','app.js','sleek.css','overrides.js','manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(fetch(req).then(r=>{
    const copy=r.clone();
    caches.open(CACHE).then(c=>c.put(req,copy));
    return r;
  }).catch(()=>caches.match(req)));
});