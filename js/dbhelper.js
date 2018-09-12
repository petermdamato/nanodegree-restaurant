var appDb = (function() {
  'use strict';

  // check for indexedDB support
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  /**
   * Initialize database
   */
  var db = idb.open('restaurant-review', 1, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
      // First DB after creation
      case 0:
      case 1:
        console.log('Creating the restaurant object store');
        upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
        console.log('Creating the review object store');
        upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
        upgradeDb.createObjectStore('offline-reviews', {keyPath: 'updatedAt'});
    }
  });

  /**
   * Get all restaurants from JSON server data, cache clientside
   */
  function addRestaurants() {
    fetch(`${DBHelper.DATABASE_URL}restaurants`)
      .then(response => response.json())
      .then(function(restaurants) {
      // Cache the database
      db.then((db) => {
        let restaurantValStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
          for (const restaurant of restaurants) {
            restaurantValStore.put(restaurant);
          }
      });
      // Make data available
        callback(null, restaurants);
      }).catch(function (err) {
        db.then( (db) => {
          let restaurantValStore = db.transaction('restaurants').objectStore('restaurants');
          return restaurantValStore.getAll();
      });
    });
  }

  // function addReviews() {
  //   fetch(DBHelper.DATABASE_REVIEWS_URL)
  //     .then(response => response.json())
  //     .then(function(reviews) {
  //     // Cache the database
  //     db.then((db) => {
  //       'then'
  //       let reviewValStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
  //         for (const review of reviews) {
  //           reviewValStore.put(review);
  //         }
  //     });
  //     // Make data available
  //       callback(null, reviews);
  //     }).catch(function (err) {
  //       db.then( (db) => {
  //         let reviewValStore = db.transaction('reviews','readwrite')
  //           .objectStore('reviews');
  //         return reviewValStore.getAll();
  //     });
  //   });
  // }

  // Get restaurant by id
  function getByID(id) {
    return db.then(function(db) {
      const tx = db.transaction('restaurants', 'readonly');
      const store = tx.objectStore('restaurants');
      return store.get(parseInt(id));
      }).then(function(restaurantObject) {
        return restaurantObject;
      }).catch(function(e) {
      console.log("fetchRestaurantById failed on error ", e);
    });
  }

  // Get the restaurants
  function getAll() {
    db.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    }).then(allObjs => console.log(allObjs));
  }

  // Here come the promises
  return {
    db: (db),    
    addRestaurants: (addRestaurants),
    getByID: (getByID),
    getAll: (getAll)
  };
})();


/**
 * Common database helper functions.
 */
 class DBHelper {

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/`;
  }

  static get DATABASE_REVIEWS_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // attempt to get restaurants from indexedDB
    appDb.addRestaurants(callback);
    // if no restaurants, get them from the server
    if (!restaurants) {
      fetch(DBHelper.DATABASE_URL + 'restaurants')
      .then(function(response) {
        // fetch from URL
        return response.json();
      }).then(function(returnRestaurants) {
        // take the response and get an array of restaurants
        const restaurants = returnRestaurants;
        callback(null, restaurants);
        //if everything good, return restaurants
      })
      .catch(function(error) {
        callback(error, null);
        //if fails send the error back.
      });
  }}

  /**
   * Fetch a restaurant by its ID.
   */
   //Retrieve the restaurant from IndexedDB data if it's there, else retrieve online
   static fetchRestaurantById(id, callback) {
    // Fetch all restaurants with proper error handling.
    const restaurant = appDb.getByID(id);
    restaurant.then(function(restaurantObject) {
      if (restaurantObject) {
        callback(null, restaurantObject);
        return;
      }
      else {
        DBHelper.fetchRestaurants((error, restaurants) => {
          if (error) {
            callback(error, null);
          } else {
            const restaurant = restaurants.find(r => r.id == id);
            if (restaurant) { // Got the restaurant
              callback(null, restaurant);
            } else { // Restaurant does not exist in the database
              callback('Restaurant does not exist', null);
            }
          }
        });
      }
    });
  }

  /**
   * Fetch the reviews for a restaurant by its ID.
   */
   //Retrieve the reviews from IDB data if it's there, else retrieve online
  static fetchReviewsById(id, callback) {
    // Fetch all reviews for a restaurant based on its ID with proper error handling.
    const restaurant = appDb.getByID(id);

    appDb.db.then((db) => {
        let reviewValStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
        reviewValStore.getAll().then(results => {
          const reviewCollection = results.filter(r => r.restaurant_id == id);
          if (reviewCollection.length > 0) {
            callback(null, reviewCollection)
          } else {
            fetch(`${DBHelper.DATABASE_URL}reviews?restaurant_id=${id}`)
              .then(function(response) {
                // fetch from URL
                return response.json();
              }).then(function(returnReviews) {
                // take the response and get an array of restaurants
                const reviewCollection = returnReviews;
                let reviewValStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
                  for (const review of reviewCollection) {
                    reviewValStore.put(review);
                  }
                callback(null, reviewCollection);
              })
              .catch(function(error) {
                callback(error, null);
                //if fails send the error back.
              });     
          };

        });
      
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          const results = restaurants.filter(r => r.cuisine_type == cuisine);
          callback(null, results);
        }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          const results = restaurants.filter(r => r.neighborhood == neighborhood);
          callback(null, results);
        }
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          let results = restaurants;
          if (cuisine != 'all') { // filter by cuisine
            results = results.filter(r => r.cuisine_type == cuisine);
          }
          if (neighborhood != 'all') { // filter by neighborhood
            results = results.filter(r => r.neighborhood == neighborhood);
          }
          callback(null, results);
        }
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
          // Remove duplicates from neighborhoods
          const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
          callback(null, uniqueNeighborhoods);
        }
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
          // Remove duplicates from cuisines
          const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
          callback(null, uniqueCuisines);
        }
     });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph == undefined)
      restaurant.photograph = restaurant.id;
    return (`/img/${restaurant.photograph}` + '.webp');

  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const markerMarkup = "<a href=" + DBHelper.urlForRestaurant(restaurant) + ">" + restaurant.name + "</a>";

    const marker = new L.marker([restaurant.latlng.lat,restaurant.latlng.lng]).addTo(map).bindPopup(markerMarkup)

    return marker;
  }

  static postReview(data) {
    return fetch(DBHelper.DATABASE_REVIEWS_URL, {
      body: JSON.stringify(data), 
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      referrer: 'no-referrer'
    })
    .then(response => {
      console.log(response)
      return response.json()
        .then(data => {
          // Put fetched reviews into IDB
          appDb.db.then((db) => {
          let reviewValStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
          reviewValStore.put(data);
          return data;
          });
          
        });
    })
    .catch(error => {
      /**
       * For offline use
       */

      appDb.db.then((db) => {
        let reviewValStore = db.transaction('offline-reviews', 'readwrite').objectStore('offline-reviews');
        reviewValStore.put(data);
        console.log('Offline review stored');
        return
      });
    });
  }
  static toggleFavorite(fav, id) {
    // TODO, after you do this once, need to regather the restaurant information
    var rest_id = id;
    
    var favorited;
    fetch(`${DBHelper.DATABASE_URL}restaurants/${rest_id}`, {
        method: 'GET'
      }).then(response => {
        return response.json();
      }).then(data => {
        favorited = (String(data.is_favorite) == "true")
      }).then(function() {
            fetch(`${DBHelper.DATABASE_URL}restaurants/${rest_id}/?is_favorite=${!favorited}`, {
                method: 'PUT'
              })
              .then(response => {
                return response.json();
              })
              .then(data => {
                appDb.db.then((db) => {
                  let restaurantValStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
                  restaurantValStore.put(data)
                });
                return data;
              }).catch(error => {
                console.log(error)
              })
      }).catch(error => {
        console.log("Favorite data not found")
      });
  }
}

// Use this function instead of background sync to immediately send reviews
function offlineOnline() {
  if (navigator.onLine) {
    var db = idb.open('restaurant-review', 1);
    db.then((db) => {
        let valStoreFrom = db.transaction('offline-reviews', 'readwrite').objectStore('offline-reviews');
        valStoreFrom.getAll().then(reviews => {
            console.log('Posting offline reviews...')
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
}

window.addEventListener('online',  offlineOnline);
window.addEventListener('offline', offlineOnline);
