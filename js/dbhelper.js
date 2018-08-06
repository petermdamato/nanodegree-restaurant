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
        console.log('Creating the restaurant review object store');
        upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
    }
  });

  /**
   * Get all restaurants from JSON server data, cache clientside
   */
  function addRestaurants() {
    fetch(DBHelper.DATABASE_URL)
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
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // attempt to get restaurants from indexedDB
    appDb.addRestaurants(callback);
    // if no restaurants, get them from the server
    if (!restaurants) {
      fetch(DBHelper.DATABASE_URL)
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
}
