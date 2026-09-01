const CACHE='pat-v14';
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
  const url=new URL(req.url);

  if(req.mode==='navigate'){
    const isSync=url.searchParams.has('raw')||url.searchParams.has('data');
    if(isSync){
      e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('index.html')));
      return;
    }
    e.respondWith((async()=>{
      const cached=await caches.match('index.html');
      const network=fetch(req,{cache:'no-store'}).then(async r=>{
        if(r&&r.ok){const c=await caches.open(CACHE);await c.put('index.html',r.clone())}
        return r;
      }).catch(()=>null);
      return cached||await network;
    })());
    return;
  }

  e.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached){
      e.waitUntil(fetch(req).then(async r=>{if(r&&r.ok){const c=await caches.open(CACHE);await c.put(req,r.clone())}}).catch(()=>{}));
      return cached;
    }
    const r=await fetch(req);
    if(r&&r.ok){const c=await caches.open(CACHE);await c.put(req,r.clone())}
    return r;
  })());
});