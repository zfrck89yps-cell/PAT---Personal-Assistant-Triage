self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
      await self.registration.unregister();
      const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
      for(const client of clients){try{client.postMessage({type:'PAT_SW_RETIRED'})}catch(e){}}
    }catch(e){}
  })());
});
