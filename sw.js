const CACHE='pat-v9';
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
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clients){
      try{await client.navigate(client.url)}catch(err){}
    }
  })());
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(async r=>{
      let html=await r.text();
      if(!html.includes('sleek.css')) html=html.replace('</head>','<link rel="stylesheet" href="sleek.css?v=9"></head>');
      if(!html.includes('overrides.js')) html=html.replace('</body>','<script src="overrides.js?v=9"></script></body>');
      return new Response(html,{status:r.status,statusText:r.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
    }).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(fetch(req).then(r=>{
    const copy=r.clone();
    caches.open(CACHE).then(c=>c.put(req,copy));
    return r;
  }).catch(()=>caches.match(req)));
});