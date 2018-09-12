var staticCacheName = 'rr-static-v1';
var contentImgsCache = 'rr-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

importScripts('./js/idb.js')
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      console.log('Service worker initd')
      return cache.addAll([
        '/',
        './sw.js',
        './index.html',
        './restaurant.html',
        './css/styles.css',
        './js/animations.js',
        './js/restaurant_info.js',
        './js/dbhelper.js',
        './js/idb.js',
        './js/register_sw.js'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      console.log('Service worker actvd')
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('rr-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request, {ignoreSearch:true}).then(function(response) { 
        return response || fetch(event.request);
    })
  );
});

function servePhoto(request) {
  var storageUrl = request.url.replace(/-\d+px\.webp$/, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', function (event) {    
    if (event.tag == 'myFirstSync') {
        console.log('Yo')
    var db = idb.open('restaurant-review', 1);
    db.then((db) => {
        let valStoreFrom = db.transaction('offline-reviews', 'readwrite').objectStore('offline-reviews');
        valStoreFrom.getAll().then(reviews => {
            reviews.forEach(review => {
                fetch('http://localhost:1337/reviews/', {
                        body: JSON.stringify(review),
                        cache: 'no-cache', 
                        credentials: 'same-origin', 
                        headers: {
                            'content-type': 'application/json'
                        },
                        method: 'POST',
                        mode: 'cors', 
                        redirect: 'follow', 
                        referrer: 'no-referrer',
                    }).then(response => {
                        return response.json();
                    }).then(data => {
                        let valStoreTo = db.transaction('reviews', 'readwrite').objectStore('reviews');
                        valStoreTo.put(data);
                        return;
                    })
                });
            })
        valStoreFrom.clear();
        })    
  }
    
});