const CACHE='liang-ren-shi-guang-v3';
const BASE=new URL('./',self.registration.scope).pathname;
const CORE=[BASE,`${BASE}manifest.webmanifest`,`${BASE}pet-avatar.png`];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const page=await fetch(BASE,{cache:'reload'});
    const html=await page.clone().text();
    await cache.put(BASE,page);
    const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map(match=>match[1])
      .map(url=>new URL(url,self.registration.scope).pathname)
      .filter(url=>url.startsWith(BASE));
    await cache.addAll([...new Set([...CORE.slice(1),...assets])]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(BASE,copy));
      return response;
    }).catch(()=>caches.match(BASE)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{
    const fresh=fetch(event.request).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
      return response;
    }).catch(()=>cached);
    return cached||fresh;
  }));
});
